import bpy
import math
import os
import shutil
from mathutils import Vector

ROOT = os.environ.get("AGROMONT_ASSET_OUT", "/tmp/agromont-assets")
RAW = os.path.join(ROOT, "raw")
SRC = os.path.join(ROOT, "source")
TEX = os.path.join(ROOT, "textures")
for p in (RAW, SRC, TEX):
    os.makedirs(p, exist_ok=True)

bpy.context.scene.render.engine = "CYCLES"
bpy.context.scene.render.image_settings.file_format = "PNG"
bpy.context.scene.render.resolution_percentage = 100

MAT_META = {}

def reset():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in (bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.images):
        pass

def principled(mat):
    return mat.node_tree.nodes.get("Principled BSDF")

def make_mat(name, base, metallic=0.0, rough=0.55, noise=0.08, bump=0.08, alpha=1.0, transmission=0.0, emission=None):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    for n in list(nodes):
        if n.type != "OUTPUT_MATERIAL":
            nodes.remove(n)
    out = nodes.get("Material Output")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    noise_node = nodes.new("ShaderNodeTexNoise")
    noise_node.inputs["Scale"].default_value = 10.0
    noise_node.inputs["Detail"].default_value = 4.0
    noise_node.inputs["Roughness"].default_value = 0.65
    ramp = nodes.new("ShaderNodeValToRGB")
    c = base
    lo = tuple(max(0.0, min(1.0, x * (1.0 - noise))) for x in c)
    hi = tuple(max(0.0, min(1.0, x * (1.0 + noise))) for x in c)
    ramp.color_ramp.elements[0].color = (*lo, 1)
    ramp.color_ramp.elements[1].color = (*hi, 1)
    links.new(noise_node.outputs["Fac"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = rough
    if bump > 0:
        bump_node = nodes.new("ShaderNodeBump")
        bump_node.inputs["Strength"].default_value = bump
        bump_node.inputs["Distance"].default_value = 0.08
        links.new(noise_node.outputs["Fac"], bump_node.inputs["Height"])
        links.new(bump_node.outputs["Normal"], bsdf.inputs["Normal"])
    if transmission > 0:
        if "Transmission Weight" in bsdf.inputs:
            bsdf.inputs["Transmission Weight"].default_value = transmission
        elif "Transmission" in bsdf.inputs:
            bsdf.inputs["Transmission"].default_value = transmission
        bsdf.inputs["IOR"].default_value = 1.45
    if alpha < 1:
        bsdf.inputs["Alpha"].default_value = alpha
        mat.surface_render_method = "DITHERED"
    if emission is not None:
        ecolor, strength = emission
        if "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = (*ecolor, 1)
            bsdf.inputs["Emission Strength"].default_value = strength
        elif "Emission" in bsdf.inputs:
            bsdf.inputs["Emission"].default_value = (*ecolor, 1)
            if "Emission Strength" in bsdf.inputs:
                bsdf.inputs["Emission Strength"].default_value = strength
    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    MAT_META[name] = dict(base=base, metallic=metallic, rough=rough, alpha=alpha, transmission=transmission, emission=emission)
    return mat

def mats():
    return {
        "white": make_mat("PaintedWhite", (0.83,0.84,0.80), 0.05, 0.58, 0.06, 0.06),
        "green": make_mat("AgromontGreen", (0.055,0.22,0.12), 0.08, 0.56, 0.07, 0.05),
        "stainless": make_mat("Stainless", (0.56,0.59,0.58), 0.82, 0.28, 0.10, 0.05),
        "galv": make_mat("Galvanized", (0.52,0.55,0.53), 0.72, 0.44, 0.15, 0.08),
        "dark": make_mat("DarkMetal", (0.035,0.045,0.042), 0.45, 0.50, 0.08, 0.04),
        "rubber": make_mat("Rubber", (0.012,0.014,0.013), 0.0, 0.88, 0.12, 0.12),
        "glass": make_mat("Glass", (0.17,0.24,0.25), 0.0, 0.12, 0.02, 0.0, 0.32, 0.65),
        "blue": make_mat("CollectorBlue", (0.035,0.23,0.43), 0.28, 0.42, 0.06, 0.04),
        "yellow": make_mat("SafetyYellow", (0.92,0.56,0.04), 0.15, 0.48, 0.04, 0.03),
        "card": make_mat("Cardboard", (0.44,0.33,0.22), 0.0, 0.88, 0.15, 0.08),
        "light": make_mat("LightLens", (0.95,0.52,0.10), 0.0, 0.22, 0.01, 0.0, emission=((1.0,0.38,0.04), 2.0)),
    }

def select_only(objs):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    if objs:
        bpy.context.view_layer.objects.active = objs[0]

def apply_mods(obj):
    if obj.type != "MESH":
        return
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    for mod in list(obj.modifiers):
        try:
            bpy.ops.object.modifier_apply(modifier=mod.name)
        except Exception:
            pass
    obj.select_set(False)

def add_box(name, loc, scale, mat, bevel=0.04, seg=3, rot=(0,0,0)):
    bpy.ops.mesh.primitive_cube_add(location=loc, rotation=rot)
    o = bpy.context.object
    o.name = name
    o.scale = (scale[0]/2, scale[1]/2, scale[2]/2)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel > 0:
        m = o.modifiers.new("Bevel", "BEVEL")
        m.width = bevel
        m.segments = seg
        m.limit_method = "ANGLE"
    o.data.materials.append(mat)
    return o

def add_cyl(name, loc, radius, depth, mat, verts=32, rot=(0,0,0), bevel=0.02):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=radius, depth=depth, location=loc, rotation=rot)
    o = bpy.context.object
    o.name = name
    if bevel:
        m = o.modifiers.new("Bevel", "BEVEL")
        m.width = bevel
        m.segments = 2
    o.data.materials.append(mat)
    return o

def add_sphere(name, loc, scale, mat, seg=32, rings=16):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=rings, location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.data.materials.append(mat)
    return o

def add_torus(name, loc, major, minor, mat, rot=(0,0,0), seg=32, minor_seg=10):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor, major_segments=seg, minor_segments=minor_seg, location=loc, rotation=rot)
    o = bpy.context.object
    o.name = name
    o.data.materials.append(mat)
    return o

def add_pipe(name, a, b, radius, mat, verts=20):
    a, b = Vector(a), Vector(b)
    delta = b-a
    mid = (a+b)/2
    o = add_cyl(name, mid, radius, delta.length, mat, verts=verts, bevel=radius*0.18)
    o.rotation_mode = "QUATERNION"
    o.rotation_quaternion = Vector((0,0,1)).rotation_difference(delta.normalized())
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=False)
    return o

def extrude_profile(name, profile, depth, mat, bevel=0.06):
    verts = [(x,y,-depth/2) for x,y in profile] + [(x,y,depth/2) for x,y in profile]
    n = len(profile)
    faces = []
    faces.append(tuple(range(n)))
    faces.append(tuple(range(n,2*n)))
    for i in range(n):
        j = (i+1)%n
        faces.append((i,j,n+j,n+i))
    mesh = bpy.data.meshes.new(name+"Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    o = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(o)
    o.data.materials.append(mat)
    if bevel:
        m = o.modifiers.new("Bevel", "BEVEL")
        m.width = bevel
        m.segments = 3
    return o

def build_truck(M):
    objs=[]
    opaque=[]
    glass=[]

    # European medium-duty rigid box truck proportions, based on the stronger
    # live silhouette rather than the rejected first Blender pass.
    profile=[
        (-3.54,0.70),(-3.48,1.02),(-3.36,1.42),(-3.05,2.40),
        (-2.72,2.70),(-1.42,2.70),(-1.20,2.43),(-1.16,0.70)
    ]
    cab=extrude_profile("TruckCab", profile, 2.08, M["white"], .05)
    objs.append(cab); opaque.append(cab)

    # Windscreen and black surround give the cab a manufactured shell rather
    # than a glass rectangle stuck on a box.
    wind=add_box("Windscreen",(-3.075,2.02,0),(0.045,0.82,1.70),M["glass"],.008,2,rot=(0,0,-0.275))
    glass.append(wind); objs.append(wind)
    surround_top=add_box("WindscreenTop",(-2.94,2.46,0),(0.07,0.07,1.83),M["dark"],.01,2,rot=(0,0,-0.275))
    opaque.append(surround_top); objs.append(surround_top)
    divider=add_box("WindscreenDivider",(-3.11,2.02,0),(0.065,0.84,0.04),M["dark"],.008,2,rot=(0,0,-0.275))
    opaque.append(divider); objs.append(divider)

    # Deep front fascia, grille, bumper and separate lamps.
    fascia=add_box("FrontFascia",(-3.49,1.18,0),(0.08,0.86,1.70),M["white"],.018,2)
    opaque.append(fascia); objs.append(fascia)
    bumper=add_box("Bumper",(-3.60,0.78,0),(0.22,0.24,2.10),M["dark"],.035,3)
    opaque.append(bumper); objs.append(bumper)
    lower=add_box("LowerValance",(-3.51,0.98,0),(0.07,0.28,1.76),M["dark"],.018,2)
    opaque.append(lower); objs.append(lower)
    grille=add_box("Grille",(-3.535,1.28,0),(0.035,0.46,1.08),M["dark"],.008,1)
    opaque.append(grille); objs.append(grille)
    for i in range(8):
        sl=add_box("GrilleSlat",(-3.558,1.105+i*.052,0),(0.018,0.018,1.01),M["galv"],0,1)
        opaque.append(sl); objs.append(sl)
    plate=add_box("LicensePlate",(-3.62,0.86,0),(0.025,0.14,0.44),M["white"],.006,1)
    opaque.append(plate); objs.append(plate)

    for z in (-.74,.74):
        lamp=add_box("HeadLamp",(-3.575,1.50,z),(.07,.23,.34),M["light"],.018,3)
        opaque.append(lamp); objs.append(lamp)
        indicator=add_box("Indicator",(-3.582,1.34,z*1.02),(.065,.09,.25),M["light"],.012,2)
        opaque.append(indicator); objs.append(indicator)

    visor=add_box("Visor",(-2.92,2.55,0),(0.50,0.07,1.92),M["dark"],.018,2,rot=(0,0,-.15))
    opaque.append(visor); objs.append(visor)

    # Realistic doors, glazing, mirrors and entry hardware on both sides.
    for z in (-1.045,1.045):
        sw=add_box("SideWindow",(-2.18,2.03,z),(0.90,0.62,0.028),M["glass"],.012,2)
        glass.append(sw); objs.append(sw)
        door=add_box("DoorSkin",(-2.08,1.48,z*1.012),(1.10,1.62,0.026),M["white"],.012,2)
        opaque.append(door); objs.append(door)
        belt=add_box("WindowBelt",(-2.17,1.71,z*1.025),(1.02,0.045,0.035),M["dark"],.006,1)
        opaque.append(belt); objs.append(belt)
        handle=add_box("DoorHandle",(-1.72,1.63,z*1.04),(0.22,0.045,0.045),M["dark"],.008,2)
        opaque.append(handle); objs.append(handle)
        mirror=add_box("Mirror",(-3.02,2.26,z*1.23),(0.18,0.34,0.11),M["dark"],.025,2)
        opaque.append(mirror); objs.append(mirror)
        arm=add_pipe("MirrorArm",(-2.90,2.28,z*1.02),(-3.00,2.28,z*1.18),.024,M["dark"],12)
        opaque.append(arm); objs.append(arm)
        step=add_box("CabStep",(-1.58,0.72,z*1.08),(0.82,0.10,0.25),M["galv"],.018,2)
        opaque.append(step); objs.append(step)
        lower_step=add_box("LowerStep",(-1.78,0.53,z*1.08),(0.52,0.08,0.22),M["dark"],.014,2)
        opaque.append(lower_step); objs.append(lower_step)

    chassis=add_box("Chassis",(0.20,0.60,0),(6.95,0.23,1.72),M["dark"],.025,2)
    opaque.append(chassis); objs.append(chassis)

    # Box body with actual roof/floor rails and rear-door hardware.
    cargo=add_box("CargoBox",(1.35,1.90,0),(5.35,2.30,2.15),M["white"],.04,3)
    opaque.append(cargo); objs.append(cargo)
    for z in (-1.09,1.09):
        toprail=add_box("CargoTopRail",(1.35,3.04,z),(5.38,.07,.05),M["galv"],.012,2)
        botrail=add_box("CargoBottomRail",(1.35,.76,z),(5.38,.07,.05),M["galv"],.012,2)
        opaque.extend([toprail,botrail]); objs.extend([toprail,botrail])

    for x in [-.95,-.28,.39,1.06,1.73,2.40,3.07]:
        for z in (-1.095,1.095):
            rib=add_box("CargoRib",(x,1.90,z),(.04,2.12,.035),M["galv"],.006,1)
            opaque.append(rib); objs.append(rib)

    # Rear doors/hinges are camera-visible late in the logistics shot.
    for z in (-.53,.53):
        rear_door=add_box("RearDoor",(4.035,1.91,z),(.045,2.05,1.00),M["white"],.012,2)
        opaque.append(rear_door); objs.append(rear_door)
        for y in (1.12,2.67):
            hinge=add_box("RearHinge",(4.065,y,z),(.055,.12,.16),M["dark"],.01,2)
            opaque.append(hinge); objs.append(hinge)
        bar=add_pipe("RearLock",(4.075,.98,z),(4.075,2.84,z),.025,M["dark"],10)
        opaque.append(bar); objs.append(bar)

    fair=extrude_profile("RoofFairing",[(-1.50,2.62),(-.90,3.14),(-.12,3.14),(-.12,2.62)],1.98,M["white"],.035)
    opaque.append(fair); objs.append(fair)

    for z in (-.96,.96):
        guard=add_box("SideGuard",(1.25,.63,z),(4.55,.11,.075),M["galv"],.015,2)
        opaque.append(guard); objs.append(guard)

    # Three axles with tread, hubs, lug nuts and compact mudflaps.
    axle_x=(-2.35,.28,2.55)
    for x in axle_x:
        for z in (-1.08,1.08):
            tire=add_cyl("Tire",(x,.47,z),.46,.31,M["rubber"],56,rot=(math.pi/2,0,0),bevel=.028)
            opaque.append(tire); objs.append(tire)
            hub=add_cyl("Hub",(x,.47,z*1.01),.19,.325,M["galv"],36,rot=(math.pi/2,0,0),bevel=.018)
            opaque.append(hub); objs.append(hub)
            for k in range(18):
                ang=2*math.pi*k/18
                tread=add_box("Tread",(x+math.cos(ang)*.466,.47+math.sin(ang)*.466,z),(0.11,.042,.32),M["rubber"],.006,1,rot=(0,0,ang))
                opaque.append(tread); objs.append(tread)
            for k in range(6):
                ang=2*math.pi*k/6
                lug=add_cyl("Lug",(x+math.cos(ang)*.115,.47+math.sin(ang)*.115,z*1.018),.018,.03,M["dark"],10,rot=(math.pi/2,0,0),bevel=.004)
                opaque.append(lug); objs.append(lug)

    for x in (.28,2.55):
        for z in (-1.02,1.02):
            flap=add_box("Mudflap",(x+.42,.40,z),(.10,.58,.34),M["rubber"],.008,1)
            opaque.append(flap); objs.append(flap)

    # Tanks, exhaust, marker lamps and branded side panel.
    for z in (-.92,.92):
        tank=add_cyl("Tank",(-.72,.86,z),.26,1.15,M["galv"],36,rot=(0,math.pi/2,0),bevel=.02)
        opaque.append(tank); objs.append(tank)
    exhaust=add_pipe("Exhaust",(-1.30,.84,.92),(-1.30,2.66,.92),.07,M["dark"],18)
    opaque.append(exhaust); objs.append(exhaust)

    for x in (-.40,.80,2.00,3.20):
        for z in (-1.115,1.115):
            marker=add_box("MarkerLamp",(x,1.02,z),(.12,.07,.035),M["light"],.008,2)
            opaque.append(marker); objs.append(marker)

    rear=add_box("RearBar",(4.10,.65,0),(.18,.22,2.05),M["dark"],.025,2)
    opaque.append(rear); objs.append(rear)
    logo=add_box("BrandPanel",(1.65,2.0,1.095),(2.5,.72,.025),M["green"],.012,2)
    opaque.append(logo); objs.append(logo)

    return objs, opaque, glass

def build_grader(M):
    objs=[]; opaque=[]; glass=[]
    L=8.9
    for z in (-.92,.92):
        for y in (.55,1.42):
            o=add_box("FrameRail",(-.10,y,z),(L,.085,.085),M["stainless"],.018,2); opaque.append(o); objs.append(o)
    for x in [-4.05,-2.7,-1.35,0,1.35,2.7,4.05]:
        for z in (-.84,.84):
            o=add_box("Leg",(x,.55,z),(.095,1.1,.095),M["stainless"],.018,2); opaque.append(o); objs.append(o)
    rows=6
    spacing=.225
    for r in range(rows):
        z=(r-(rows-1)/2)*spacing
        rail=add_box("Track",(-.12,1.15,z),(8.35,.07,.11),M["dark"],.012,1); opaque.append(rail); objs.append(rail)
        for i in range(22):
            x=-4.0+i*(7.8/21)
            cup=add_cyl("Carrier",(x,1.22,z),.065,.17,M["stainless"],12,rot=(math.pi/2,0,0),bevel=.006); opaque.append(cup); objs.append(cup)
            if (i+r)%5==0:
                egg=add_sphere("Egg",(x,1.42,z),(.11,.15,.11),M["white"],20,10); opaque.append(egg); objs.append(egg)
    infeed=add_box("Infeed",(-3.92,1.63,0),(.82,.46,1.72),M["stainless"],.035,3); opaque.append(infeed); objs.append(infeed)
    hood=add_box("InspectorHood",(-.56,1.94,0),(1.28,.27,1.82),M["stainless"],.035,3); opaque.append(hood); objs.append(hood)
    window=add_box("InspectorGlass",(-.56,1.92,.93),(.86,.19,.025),M["glass"],.008,2); glass.append(window); objs.append(window)
    for z in (-.78,.78):
        p=add_box("InspectorPost",(-.56,1.20,z),(.10,1.48,.10),M["stainless"],.018,2); opaque.append(p); objs.append(p)
    cabinet=add_box("ControlCabinet",(2.64,1.26,-1.03),(.65,1.04,.39),M["white"],.035,3); opaque.append(cabinet); objs.append(cabinet)
    screen=add_box("Touchscreen",(2.64,1.50,-1.235),(.38,.24,.026),M["glass"],.008,2); glass.append(screen); objs.append(screen)
    motor=add_cyl("DriveMotor",(4.14,.90,.98),.24,.58,M["dark"],24,rot=(0,math.pi/2,0),bevel=.02); opaque.append(motor); objs.append(motor)
    lanes=14
    for lane in range(lanes):
        z=-1.55+lane*(3.10/(lanes-1))
        rail=add_box("PackLane",(3.02,.94,z),(2.45,.085,.18),M["stainless"],.015,2); opaque.append(rail); objs.append(rail)
        guide=add_box("LaneGuide",(3.02,1.18,z+.08),(2.35,.04,.04),M["dark"],.006,1); opaque.append(guide); objs.append(guide)
        terminal=add_box("PackerHead",(4.08,1.16,z),(.38,.44,.31),M["white"],.025,2); opaque.append(terminal); objs.append(terminal)
        if lane%3==0:
            carton=add_box("Carton",(3.48,1.10,z),(.43,.13,.30),M["card"],.012,2); opaque.append(carton); objs.append(carton)
    return objs, opaque, glass

def build_process(M):
    objs=[]; opaque=[]; glass=[]
    for x in (-2.75,0,2.75):
        for z in (-1.55,1.55):
            o=add_box("Column",(x,3.70,z),(.15,7.4,.15),M["galv"],.018,2); opaque.append(o); objs.append(o)
    for y in (1.40,3.80,6.20,7.35):
        for z in (-1.55,1.55):
            o=add_box("Beam",(0,y,z),(5.7,.13,.15),M["galv"],.018,2); opaque.append(o); objs.append(o)
    for z in (-1.60,1.60):
        for x in (-1.38,1.38):
            for sign in (-1,1):
                o=add_box("Brace",(x,3.75+sign*1.20,z),(3.20,.07,.07),M["dark"],.01,1,rot=(0,0,sign*.72)); opaque.append(o); objs.append(o)
    for x in (-1.55,0,1.55):
        vessel=add_cyl("Vessel",(x,5.15,-.60),.56,2.45,M["stainless"],36,bevel=.025); opaque.append(vessel); objs.append(vessel)
        cone=add_cyl("ConeBase",(x,3.55,-.60),.56,.20,M["stainless"],36,bevel=.015); opaque.append(cone); objs.append(cone)
        bpy.ops.mesh.primitive_cone_add(vertices=36, radius1=.56, radius2=.12, depth=1.05, location=(x,3.25,-.60))
        con=bpy.context.object; con.data.materials.append(M["stainless"]); opaque.append(con); objs.append(con)
        for y in (3.88,4.02,6.38):
            ring=add_torus("Flange",(x,y,-.60),.57,.032,M["dark"],rot=(math.pi/2,0,0),seg=28); opaque.append(ring); objs.append(ring)
    collector=add_box("Collector",(3.42,5.10,.50),(1.55,2.28,1.18),M["blue"],.035,3); opaque.append(collector); objs.append(collector)
    bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=.76, radius2=.20, depth=1.25, location=(3.42,3.35,.50), rotation=(0,0,math.pi/4))
    hop=bpy.context.object; hop.data.materials.append(M["blue"]); opaque.append(hop); objs.append(hop)
    duct1=add_pipe("TopDuct",(-2.65,7.45,.68),(2.75,7.45,.68),.17,M["galv"],20); opaque.append(duct1); objs.append(duct1)
    duct2=add_pipe("CollectorDuct",(1.05,6.18,.50),(3.48,6.18,.50),.19,M["galv"],20); opaque.append(duct2); objs.append(duct2)
    for y in (3.90,6.48):
        deck=add_box("Deck",(0,y,1.70),(5.4,.10,.92),M["dark"],.018,2); opaque.append(deck); objs.append(deck)
        for x in [i*.5-2.5 for i in range(11)]:
            p=add_box("RailPost",(x,y+.48,2.12),(.045,.84,.045),M["galv"],.005,1); opaque.append(p); objs.append(p)
        rail=add_box("Rail",(0,y+.88,2.12),(5.35,.045,.045),M["galv"],.005,1); opaque.append(rail); objs.append(rail)
    for x in (2.68,3.30):
        ladder=add_box("LadderRail",(x,3.58,-1.72),(.045,7.0,.045),M["yellow"],.005,1); opaque.append(ladder); objs.append(ladder)
    for y in [0.55+i*.48 for i in range(14)]:
        rung=add_box("Rung",(2.99,y,-1.72),(.62,.04,.04),M["yellow"],.004,1); opaque.append(rung); objs.append(rung)
    load=add_cyl("LoadOut",(2.10,2.10,.40),.70,1.20,M["stainless"],32,bevel=.025); opaque.append(load); objs.append(load)
    bpy.ops.mesh.primitive_cone_add(vertices=32, radius1=.70, radius2=.14, depth=1.12, location=(2.10,.92,.40))
    lc=bpy.context.object; lc.data.materials.append(M["stainless"]); opaque.append(lc); objs.append(lc)
    for x in (-2.2,-1.0,.2,1.4):
        pipeo=add_pipe("ServicePipe",(x,1.2,-1.45),(x,6.9,-1.45),.075,M["galv"],16); opaque.append(pipeo); objs.append(pipeo)
    return objs, opaque, glass

def apply_all(objs):
    for o in objs:
        if o.type == "MESH":
            apply_mods(o)

def join_meshes(objs, name):
    meshes=[o for o in objs if o.type=="MESH"]
    select_only(meshes)
    bpy.context.view_layer.objects.active=meshes[0]
    bpy.ops.object.join()
    body=bpy.context.object
    body.name=name
    return body

def unwrap(obj):
    select_only([obj])
    bpy.context.view_layer.objects.active=obj
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.012)
    bpy.ops.object.mode_set(mode="OBJECT")

def bake_maps(asset, body, size=1024):
    unwrap(body)
    scene=bpy.context.scene
    scene.render.engine="CYCLES"
    scene.render.bake.use_clear=True
    scene.render.bake.margin=8

    images={}
    for kind, colorspace in (("basecolor","sRGB"),("roughness","Non-Color"),("normal","Non-Color")):
        img=bpy.data.images.new(f"{asset}_{kind}", width=size, height=size, alpha=False)
        img.colorspace_settings.name=colorspace
        images[kind]=img

    def set_target(img):
        for mat in body.data.materials:
            if not mat or not mat.use_nodes: continue
            nodes=mat.node_tree.nodes
            n=nodes.get("__BAKE_TARGET__")
            if n is None:
                n=nodes.new("ShaderNodeTexImage"); n.name="__BAKE_TARGET__"
            n.image=img
            nodes.active=n
            n.select=True

    select_only([body])
    bpy.context.view_layer.objects.active=body

    set_target(images["basecolor"])
    scene.render.bake.use_pass_direct=False
    scene.render.bake.use_pass_indirect=False
    scene.render.bake.use_pass_color=True
    bpy.ops.object.bake(type="DIFFUSE")

    set_target(images["roughness"])
    bpy.ops.object.bake(type="ROUGHNESS")

    set_target(images["normal"])
    bpy.ops.object.bake(type="NORMAL", normal_space="TANGENT")

    for kind,img in images.items():
        path=os.path.join(TEX,f"{asset}-{kind}.png")
        img.filepath_raw=path
        img.file_format="PNG"
        img.save()

    for mat in body.data.materials:
        if not mat: continue
        meta=MAT_META.get(mat.name, {})
        metallic=float(meta.get("metallic",0.0))
        emission=meta.get("emission")
        nodes=mat.node_tree.nodes; links=mat.node_tree.links
        nodes.clear()
        out=nodes.new("ShaderNodeOutputMaterial")
        bsdf=nodes.new("ShaderNodeBsdfPrincipled")
        base=nodes.new("ShaderNodeTexImage"); base.image=images["basecolor"]; base.image.colorspace_settings.name="sRGB"
        rough=nodes.new("ShaderNodeTexImage"); rough.image=images["roughness"]; rough.image.colorspace_settings.name="Non-Color"
        norm=nodes.new("ShaderNodeTexImage"); norm.image=images["normal"]; norm.image.colorspace_settings.name="Non-Color"
        nmap=nodes.new("ShaderNodeNormalMap")
        links.new(base.outputs["Color"],bsdf.inputs["Base Color"])
        links.new(rough.outputs["Color"],bsdf.inputs["Roughness"])
        links.new(norm.outputs["Color"],nmap.inputs["Color"])
        links.new(nmap.outputs["Normal"],bsdf.inputs["Normal"])
        bsdf.inputs["Metallic"].default_value=metallic
        if emission is not None:
            ecolor,strength=emission
            if "Emission Color" in bsdf.inputs:
                bsdf.inputs["Emission Color"].default_value=(*ecolor,1)
                bsdf.inputs["Emission Strength"].default_value=strength
        links.new(bsdf.outputs["BSDF"],out.inputs["Surface"])
    return images

def duplicate_obj(obj, name, ratio=1.0):
    dup=obj.copy(); dup.data=obj.data.copy(); bpy.context.collection.objects.link(dup); dup.name=name
    if ratio < .999 and dup.type=="MESH":
        mod=dup.modifiers.new("LODDecimate","DECIMATE"); mod.ratio=ratio
        apply_mods(dup)
    return dup

def export_selected(path, objs):
    select_only(objs)
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_cameras=False,
        export_lights=False,
        export_yup=True,
    )

def build_asset(name, builder):
    reset()
    M=mats()
    objs, opaque, glass=builder(M)
    apply_all(objs)
    body=join_meshes(opaque, name+"_Body")
    glass_body=None
    if glass:
        glass_body=join_meshes(glass, name+"_Glass")
    bake_maps(name,body,1024)

    # Modeling helpers use the site's Y-up convention. Convert authored meshes
    # into Blender Z-up before save/export so export_yup=True produces the same
    # X/Y/Z orientation expected by Three.js.
    authored_objects = [body] + ([glass_body] if glass_body else [])
    bpy.context.scene.cursor.location = (0.0, 0.0, 0.0)
    for authored in authored_objects:
        select_only([authored])
        bpy.context.view_layer.objects.active = authored
        bpy.ops.object.origin_set(type="ORIGIN_CURSOR", center="MEDIAN")
        authored.rotation_euler.x = math.pi / 2
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)

    bpy.ops.file.pack_all()
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(SRC,f"{name}.blend"))

    export_selected(os.path.join(RAW,f"{name}-lod0.glb"), authored_objects)
    for level,ratio in ((1,.56),(2,.30)):
        b=duplicate_obj(body,f"{name}_Body_LOD{level}",ratio)
        g=duplicate_obj(glass_body,f"{name}_Glass_LOD{level}",1.0) if glass_body else None
        export_selected(os.path.join(RAW,f"{name}-lod{level}.glb"), [b]+([g] if g else []))
        bpy.data.objects.remove(b,do_unlink=True)
        if g: bpy.data.objects.remove(g,do_unlink=True)

for name,builder in (("truck",build_truck),("grader",build_grader),("process-skid",build_process)):
    build_asset(name,builder)

print("AGROMONT_ASSET_BUILD_COMPLETE", ROOT)
