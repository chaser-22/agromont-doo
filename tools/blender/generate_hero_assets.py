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
    profile=[(-3.55,0.68),(-3.50,1.05),(-3.16,2.30),(-2.78,2.66),(-2.34,2.78),(-1.42,2.74),(-1.12,2.46),(-1.10,0.68)]
    cab=extrude_profile("TruckCab", profile, 2.06, M["white"], .055); objs.append(cab); opaque.append(cab)
    for z in (-1.045,1.045):
        sw=add_box("SideWindow",(-2.18,2.03,z),(0.90,0.62,0.028),M["glass"],.012,2); glass.append(sw); objs.append(sw)
        mirror=add_box("Mirror",(-3.02,2.26,z*1.23),(0.18,0.34,0.11),M["dark"],.025,2); opaque.append(mirror); objs.append(mirror)
        arm=add_pipe("MirrorArm",(-2.90,2.28,z*1.02),(-3.00,2.28,z*1.18),.024,M["dark"],12); opaque.append(arm); objs.append(arm)
        step=add_box("CabStep",(-1.56,0.72,z*1.08),(0.78,0.10,0.25),M["galv"],.018,2); opaque.append(step); objs.append(step)
    wind=add_box("Windscreen",(-3.08,2.02,0),(0.05,0.82,1.72),M["glass"],.01,2,rot=(0,0,-0.27)); glass.append(wind); objs.append(wind)
    bumper=add_box("Bumper",(-3.60,0.78,0),(0.22,0.24,2.08),M["dark"],.035,2); opaque.append(bumper); objs.append(bumper)
    grille=add_box("Grille",(-3.49,1.14,0),(0.05,0.52,1.20),M["dark"],.01,1); opaque.append(grille); objs.append(grille)
    for i in range(7):
        s=add_box("GrilleSlat",(-3.525,0.95+i*.065,0),(0.025,0.025,1.05),M["galv"],0,1); opaque.append(s); objs.append(s)
    visor=add_box("Visor",(-2.91,2.55,0),(0.48,0.07,1.90),M["dark"],.018,2,rot=(0,0,-.15)); opaque.append(visor); objs.append(visor)
    chassis=add_box("Chassis",(0.15,0.60,0),(6.9,0.23,1.70),M["dark"],.025,2); opaque.append(chassis); objs.append(chassis)
    cargo=add_box("CargoBox",(1.35,1.90,0),(5.35,2.30,2.15),M["white"],.045,3); opaque.append(cargo); objs.append(cargo)
    fair=extrude_profile("RoofFairing",[(-1.50,2.62),(-.92,3.15),(-.10,3.15),(-.10,2.62)],1.98,M["white"],.035); opaque.append(fair); objs.append(fair)
    for z in (-1.09,1.09):
        guard=add_box("SideGuard",(1.25,.63,z),(4.55,.11,.075),M["galv"],.015,2); opaque.append(guard); objs.append(guard)
    for x in (-2.35,.28,2.55):
        for z in (-1.08,1.08):
            tire=add_cyl("Tire",(x,.47,z),.46,.31,M["rubber"],48,rot=(math.pi/2,0,0),bevel=.028); opaque.append(tire); objs.append(tire)
            hub=add_cyl("Hub",(x,.47,z*1.01),.19,.325,M["galv"],32,rot=(math.pi/2,0,0),bevel=.018); opaque.append(hub); objs.append(hub)
            for k in range(16):
                ang=2*math.pi*k/16
                tread=add_box("Tread",(x+math.cos(ang)*.465,.47+math.sin(ang)*.465,z),(0.12,.045,.32),M["rubber"],.008,1,rot=(0,0,ang)); opaque.append(tread); objs.append(tread)
    for z in (-.92,.92):
        tank=add_cyl("Tank",(-.75,.86,z),.26,1.15,M["galv"],32,rot=(0,math.pi/2,0),bevel=.02); opaque.append(tank); objs.append(tank)
    exhaust=add_pipe("Exhaust",(-1.32,.85,.92),(-1.32,2.68,.92),.07,M["dark"],16); opaque.append(exhaust); objs.append(exhaust)
    for z in (-.73,.73):
        lamp=add_box("HeadLamp",(-3.56,1.39,z),(.08,.22,.34),M["light"],.018,2); opaque.append(lamp); objs.append(lamp)
    rear=add_box("RearBar",(4.03,.65,0),(.18,.22,2.05),M["dark"],.025,2); opaque.append(rear); objs.append(rear)
    logo=add_box("BrandPanel",(1.65,2.0,1.095),(2.5,.72,.025),M["green"],.012,2); opaque.append(logo); objs.append(logo)
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
    for authored in authored_objects:
        authored.rotation_euler.x = math.pi / 2
        select_only([authored])
        bpy.context.view_layer.objects.active = authored
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
