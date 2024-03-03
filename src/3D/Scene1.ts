import {
    ArcRotateCamera,
    Engine,
    Scene,
    SceneLoader,
    TransformNode,
    Vector3,
    Color4,
    HemisphericLight,
    DirectionalLight,
    ShadowGenerator,
    Nullable,
    PointLight,
    Tools,
    Mesh,
    Matrix,
    Color3,
    ActionManager,
    ExecuteCodeAction,
    Animation,
    PointerEventTypes
} from "@babylonjs/core";
import { GLTFFileLoader } from "@babylonjs/loaders";

class Scene1 extends Scene {
    engine: Engine;
    isScenePaused: boolean = false;
    sceneRoot: Nullable<TransformNode> = null;
    camera: Nullable<ArcRotateCamera> = null;
    shadowGenerator: Nullable<ShadowGenerator> = null;
    dirLight: Nullable<DirectionalLight> = null;
    pointLight: Nullable<PointLight> = null;
    model_logo: Nullable<Mesh> = null;
    isPointerDown = false;
    isPointerMove = false;

    constructor(engine: Engine) {
        super(engine, { useClonedMeshMap: true, useMaterialMeshMap: true, useGeometryUniqueIdsMap: true });
        this.engine = engine;
        this.useRightHandedSystem = true;
        this.init();
    }

    protected init() {
        GLTFFileLoader.IncrementalLoading = false;
        
        this.animationsEnabled = true;
        this.collisionsEnabled = false;

        this.addDefaultCameras();
        this.addDefaultLights();
        this.loadModels();
        this.handlePointer();

        this.engine.runRenderLoop(() => {
            if (!this.isScenePaused) {
                this.render();
            }
        });
    }

    addDefaultCameras() {
        const camera = new ArcRotateCamera("ArcRotateCamera", Math.PI/2,  Tools.ToRadians(90), 30, new Vector3(0, 3, 0), this, true);
        camera.attachControl();
        camera.inputs.remove(camera.inputs.attached.mousewheel);

        camera.wheelDeltaPercentage = 0.015;
        camera.zoomToMouseLocation = true;

        camera.inertia = 0.6
        camera.panningInertia = 0.6;
        camera.angularSensibilityX = 400;

        camera.minZ = 0.1;
        camera.maxZ = 1000;

        camera.fov = 0.7;

        camera.lowerRadiusLimit = 1;
        camera.upperRadiusLimit = 100;

        this.camera = camera;
    }

    useAutoRotateBehavior(){
        if(this.camera){
            this.camera.useAutoRotationBehavior = true;
            this.camera.autoRotationBehavior!.idleRotationSpeed = .15;
        }
    }

    addDefaultLights() {
        const hemiLight = new HemisphericLight("Hemi Light", new Vector3(0, 1, 0), this);
        hemiLight.intensity = .5;
 
        this.dirLight = new DirectionalLight("Directional Light", new Vector3(-1, -2, -1), this);
        this.dirLight.position = new Vector3(0, 10, 0);
        this.dirLight.intensity = 3;
        this.dirLight.parent = this.camera;

        this.clearColor = new Color4(0, 0, 0, 0); 
    }

    loadModels() {
        SceneLoader.ImportMesh("", "/assets/", "UNIT logo.glb", this, (meshes, particleSystems, skeletons, animations) => {   
            this.model_logo = meshes[0] as Mesh;  
            this.model_logo.scaling.scaleInPlace(1);

            this.lookAtMousePointer();

            this.model_logo.getChildMeshes().forEach((m, index)=> {
                m.renderOutline = true;
                m.outlineWidth = .1;
                m.outlineColor = Color3.FromHexString("#000000");

                if(!m.actionManager){
                    m.actionManager = new ActionManager(this);
                }

                const frameRate = 15;
                const scaleAnim = new Animation("scale", "scaling", frameRate, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);
                const keyFrames = [];
                let isAnimPlaying = false;

                keyFrames.push({
                    frame: 0,
                    value: m.scaling.clone()
                });
            
                keyFrames.push({
                    frame: frameRate,
                    value: m.scaling.clone().scaleInPlace(1.2)
                });
            
                keyFrames.push({
                    frame: frameRate * 2,
                    value: m.scaling.clone()
                });
            
                scaleAnim.setKeys(keyFrames);
            
                m.animations.push(scaleAnim);

                m.actionManager.registerAction(new ExecuteCodeAction(
                    ActionManager.OnPickDownTrigger,
                    (evt) => {
                        if(isAnimPlaying) return;
                        isAnimPlaying = true;

                        const lastIndex = this.model_logo!.getChildMeshes().length - 1;

                        this.model_logo!.getChildMeshes().forEach((childMesh, idx) => {
                            setTimeout(() => {
                                if (idx !== lastIndex) {
                                    this.beginAnimation(childMesh, 0, 2 * frameRate, false, 5);
                                }else{
                                    this.beginAnimation(childMesh, 0, 2 * frameRate, false, 5, ()=> {
                                        isAnimPlaying = false;
                                    });
                                }
                            }, 200 * idx);
                        });
                    }
                ));
            });
        });
    }

    lookAtMousePointer() {
        let time = 0;

        this.registerBeforeRender(()=> {
            time += this.getEngine().getDeltaTime() * 0.001;
            const red = Math.sin(time * 0.6) * 0.5 + 0.5;
            const green = Math.sin(time * 0.6 + 2 * Math.PI / 3) * 0.5 + 0.5;
            const blue = Math.sin(time * 0.6 + 4 * Math.PI / 3) * 0.5 + 0.5;

            const ray = this.createPickingRay(this.pointerX, this.pointerY, Matrix.Identity(), this.camera);

            const distance = 10; 
            const pickPoint = ray.origin.add(ray.direction.scale(distance));
        
            if(this.model_logo) {
                if(!this.isPointerDown){
                    if(this.isPointerMove) {
                        this.model_logo.lookAt(pickPoint);
                    }else{
                        this.model_logo.rotation.x = 0;
                    }
                }

                this.model_logo.getChildMeshes().forEach(m=> {
                    m.outlineColor = new Color3(red, green, blue);
                });
            }

            if(!this.isPointerMove) {
                this.useAutoRotateBehavior();
            }
        });
    }

    handlePointer(){
        const pointerMoveTimeout = 500;
        let moveTimeoutId: number | undefined;

        this.onPointerObservable.add((pointerInfo) => {
            this.isPointerMove = true;

            switch (pointerInfo.type) {
                case PointerEventTypes.POINTERDOWN:
                    this.isPointerDown = true;
                    break;
                case PointerEventTypes.POINTERUP:
                    this.isPointerDown = false;
                    break;
                case PointerEventTypes.POINTERMOVE:
                    this.isPointerMove = true;

                    if (moveTimeoutId !== undefined) {
                        clearTimeout(moveTimeoutId);
                    }

                    moveTimeoutId = window.setTimeout(() => {
                        this.isPointerMove = false;
                    }, pointerMoveTimeout);
                    
                    break;
                default:
                    break;
            }
        });
    }
}

export default Scene1;
