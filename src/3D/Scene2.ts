import {
    ArcRotateCamera,
    Engine,
    Scene,
    SceneLoader,
    TransformNode,
    Vector3,
    HemisphericLight,
    DirectionalLight,
    ShadowGenerator,
    Nullable,
    Tools,
    PBRMaterial,
    Color3,
    Animation,
    PointerEventTypes,
    AbstractMesh,
    RenderTargetTexture,
    Layer,
    EffectWrapper,
    EffectRenderer,
    MeshBuilder,
    StandardMaterial,
    FreeCamera} from "@babylonjs/core";
import * as GUI from "@babylonjs/gui";
import { GLTFFileLoader } from "@babylonjs/loaders";

class Scene2 extends Scene {
    engine: Engine;
    isScenePaused: boolean = false;
    arcRotateCamera: Nullable<ArcRotateCamera> = null;
    freeCamera: Nullable<FreeCamera> = null;
    shadowGenerator: Nullable<ShadowGenerator> = null;
    dirLight: Nullable<DirectionalLight> = null;
    hemiLight: Nullable<HemisphericLight> = null;
    directionalLight: Nullable<DirectionalLight> = null;
    directionalLight2: Nullable<DirectionalLight> = null;

    box_orange: Nullable<AbstractMesh> = null;
    box_green: Nullable<AbstractMesh> = null;

    model: Nullable<AbstractMesh> = null;

    computerBox: Nullable<TransformNode> = null;

    currentAnimationStage: number = 0;
    currentFrame: number = 0;

    cameraAnimations: Record<number, Animation[]> = {};

    textBlock: Nullable<GUI.TextBlock> = null;
    textBlock2: Nullable<GUI.TextBlock> = null;
    textBlock3: Nullable<GUI.TextBlock> = null;
    textBlock4: Nullable<GUI.TextBlock> = null;

    isTestMode = false;

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
        this.useRightHandedSystem = true;

        this.addDefaultCameras();
        this.addDefaultLights();
        this.loadModels();

        this.engine.runRenderLoop(() => {
            if (!this.isScenePaused) {
                this.render();
            }
        });

        if (this.isTestMode) this.setGUIForTest();
    }

    addDefaultCameras() {
        this.freeCamera = new FreeCamera("freeCamera", new Vector3(0, 5, -10), this);
        this.freeCamera.setTarget(Vector3.Zero());

        this.arcRotateCamera = new ArcRotateCamera("arcCamera", 4.712, 1.175, 13, Vector3.Zero(), this);
        this.arcRotateCamera.attachControl(this.engine.getRenderingCanvas(), true);

        this.arcRotateCamera.upperRadiusLimit = 13;
        this.arcRotateCamera.lowerRadiusLimit = 13;
        this.arcRotateCamera.panningSensibility = 0;

        this.activeCamera = this.freeCamera;

        this.addDefaultBackground();
    }

    addDefaultBackground() {
        const rtt = new RenderTargetTexture("", window.innerHeight, this)

        const background = new Layer("back", null, this);
        background.isBackground = true;
        background.texture = rtt;

        const renderImage = new EffectWrapper({
            engine: this.engine,
            fragmentShader: `
            varying vec2 vUV;

            void main(void) {
                vec3 color1 = vec3(202.0 / 255.0, 206.0 / 255.0, 234.0 / 255.0);
                vec3 color2 = vec3(251.0 / 255.0, 239.0 / 255.0, 225.0 / 255.0);
                
                vec3 gradientColor = mix(color1, color2, vUV.y);
                
                gl_FragColor = vec4(gradientColor, 1.0);
            }
            `
        });

        renderImage.effect.executeWhenCompiled(() => {
            const renderer = new EffectRenderer(this.engine);
            renderer.render(renderImage, rtt);
        });
    }

    addDefaultLights() {
        this.hemiLight = new HemisphericLight("hemiLight", new Vector3(0, 1, 0), this);
        this.hemiLight.intensity = 1;

        this.directionalLight = new DirectionalLight("directionalLight", new Vector3(-1, -2, -1), this);
        this.directionalLight.position = new Vector3(20, 40, 20);
        this.directionalLight.intensity = 0;
        this.directionalLight.shadowMaxZ = 130;

        this.directionalLight2 = new DirectionalLight("directionalLight2", new Vector3(2, 1, 1), this);
        this.directionalLight2.direction = new Vector3(3, 5, 2);
    }

    loadModels() {
        // default shapes - box orange color
        this.box_orange = MeshBuilder.CreateBox("box_orange", { size: 1 }, this);
        this.box_orange.position.y = 0.5;
        this.box_orange.rotation.y = Math.PI / 4;
        this.box_orange.scaling.scaleInPlace(0);

        const mat_box_orange = new StandardMaterial("mat_box_orange", this);
        mat_box_orange.diffuseColor = Color3.FromHexString("#FF8C3C");
        this.box_orange.material = mat_box_orange;
        this.box_orange.material.backFaceCulling = false;

        // default shapes - box green color
        this.box_green = MeshBuilder.CreateBox("box_green", { size: 1 }, this);
        this.box_green.position = new Vector3(0.005, -0.23, 2.045);
        this.box_green.rotation.y = Math.PI / 4;
        this.box_green.scaling.scaleInPlace(0);

        const mat_box_green = new PBRMaterial("mat_box_green", this);
        mat_box_green.albedoColor = new Color3(0.27, 0.69, 0.13);
        mat_box_green.metallic = 0;
        this.box_green.material = mat_box_green;
        this.box_green.material.backFaceCulling = false;

        const frameRate = 10;
        this.currentAnimationStage = 0;
        this.currentFrame = 0;

        let isScrollable = true;

        // animation stages
        const stages = [
            { start: 0, end: 2 * frameRate },   // 0 to 20
            { start: 2 * frameRate + 1, end: 4 * frameRate }, // 21 to 40
            { start: 4 * frameRate + 1, end: 7 * frameRate },  // 41 to  70
            { start: 7 * frameRate + 1, end: 9 * frameRate },  // 71 to 90
            { start: 999, end: 999 } // last
        ];

        //==============================
        // stage 0 - Play an animation to make the orange box getting bigger
        const anim_boxOrangeScale = new Animation("boxOrange Scale", "scaling", frameRate, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);

        const keyFrame_boxOrangeScale = [];

        // box_orange scale
        keyFrame_boxOrangeScale.push({
            frame: stages[0].start,
            value: Vector3.Zero()
        });

        keyFrame_boxOrangeScale.push({
            frame: stages[0].end / 3,
            value: new Vector3(0.01, 1, 1)
        });

        keyFrame_boxOrangeScale.push({
            frame: stages[0].end,
            value: new Vector3(1, 1, 1)
        });

        anim_boxOrangeScale.setKeys(keyFrame_boxOrangeScale);

        this.box_orange.animations.push(anim_boxOrangeScale);
        //==============================

        //==============================
        // stage 1 - Play an animation that grows as the orange box rotates, that moves the camera's position
        const anim_boxOrangeRotationZ = new Animation("boxOrange RotationZ", "rotation.z", frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
        const anim_boxOragneScale2 = new Animation("boxOrange Scale2", "scaling", frameRate, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);
        const anim_freeCamPosition = new Animation("freeCam Position", "position", frameRate, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);

        const keyFrame_boxOrangeRotationZ = [];
        const keyFrame_boxOrangeScale2 = [];
        const keyFrame_freeCamPosition = [];

        // box_orange rotation
        keyFrame_boxOrangeRotationZ.push({
            frame: stages[1].start,
            value: 0
        });

        keyFrame_boxOrangeRotationZ.push({
            frame: stages[1].end,
            value: -Math.PI / 2
        });

        // box_orange scale2
        keyFrame_boxOrangeScale2.push({
            frame: stages[1].start,
            value: new Vector3(1, 1, 1)
        });

        keyFrame_boxOrangeScale2.push({
            frame: stages[1].end,
            value: new Vector3(3, 3, 3)
        });

        // freeCam Position
        keyFrame_freeCamPosition.push({
            frame: stages[1].start,
            value: this.freeCamera!.position
        });

        keyFrame_freeCamPosition.push({
            frame: stages[1].end,
            value: Vector3.Zero()
        });

        anim_boxOrangeRotationZ.setKeys(keyFrame_boxOrangeRotationZ);
        anim_boxOragneScale2.setKeys(keyFrame_boxOrangeScale2);
        anim_freeCamPosition.setKeys(keyFrame_freeCamPosition);
        // ==============================

        //==============================
        // stage 2 - Play an animation with green box coming down as scale changes from top to bottom
        const anim_boxGreenScale = new Animation("boxGreen Scale", "scaling", frameRate, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);
        const anim_boxGreenPosition = new Animation("boxGreen Position", "position", frameRate, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);

        const keyFrame_boxGreenScale = [];
        const keyFrame_boxGreenPosition = [];

        // box_green scale
        keyFrame_boxGreenScale.push({
            frame: stages[2].start,
            value: this.box_green.scaling
        });

        keyFrame_boxGreenScale.push({
            frame: stages[2].end / 10 * 8,
            value: new Vector3(.2, .2, .2)
        });

        keyFrame_boxGreenScale.push({
            frame: stages[2].end,
            value: new Vector3(.1, .1, .1)
        });


        // box_green position
        keyFrame_boxGreenPosition.push({
            frame: stages[2].start,
            value: new Vector3(0.005, -0.23, 2.045)
        });

        keyFrame_boxGreenPosition.push({
            frame: stages[2].end / 10 * 7,
            value: new Vector3(0.005, -0.75, 2.045)
        });

        keyFrame_boxGreenPosition.push({
            frame: stages[2].end / 10 * 8,
            value: new Vector3(0.005, -0.95, 2.045)
        });

        keyFrame_boxGreenPosition.push({
            frame: stages[2].end,
            value: new Vector3(0.005, -0.95, 2.045)
        });

        anim_boxGreenScale.setKeys(keyFrame_boxGreenScale);
        anim_boxGreenPosition.setKeys(keyFrame_boxGreenPosition);

        this.box_green.animations.push(anim_boxGreenScale, anim_boxGreenPosition);
        //==============================

        //==============================
        // stage 3 - Play an animation that shows the computer asset as the camera falls back while looking at the green box
        const anim_freeCamPosition2 = new Animation("freeCam Position2", "position", frameRate, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);
        const anim_freeCamTarget = new Animation("freeCam Target", "target", frameRate, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);
        
        const keyFrame_freeCamPosition2 = [];
        const keyFrame_freeCamTarget = [];

        // freeCam position2
        keyFrame_freeCamPosition2.push({
            frame: stages[3].start,
            value: new Vector3(0, 0, 0)
        });

        keyFrame_freeCamPosition2.push({
            frame: stages[3].end,
            value: new Vector3(0, 5, -12)
        });

        // freeCam target
        keyFrame_freeCamTarget.push({
            frame: stages[3].start,
            value: new Vector3(0, -5, 10)
        });

        keyFrame_freeCamTarget.push({
            frame: stages[3].end,
            value: Vector3.Zero()
        });

        anim_freeCamPosition2.setKeys(keyFrame_freeCamPosition2);
        anim_freeCamTarget.setKeys(keyFrame_freeCamTarget);
        //==============================

        this.cameraAnimations = {
            0: [],
            1: [anim_freeCamPosition],
            2: [],
            3: [anim_freeCamPosition2, anim_freeCamTarget]
        };

        let lastAnimationStage = 0;

        this.onPointerObservable.add((pointerInfo) => {
            const previousStage = lastAnimationStage;
            const newStage = this.currentAnimationStage;

            if (this.textBlock4) this.textBlock4.text = "isScrollable: " + isScrollable;
            if (pointerInfo.type === PointerEventTypes.POINTERWHEEL && isScrollable) {  // when mouse wheel action
                if (this.textBlock) this.textBlock.text = "currentAnimationStage: " + this.currentAnimationStage;
                if (this.textBlock2) this.textBlock2.text = "currentFrame: " + this.currentFrame;
                if (this.textBlock3) this.textBlock3.text = "end Frame: " + stages[this.currentAnimationStage].end;

                if (this.currentFrame > 0) {  // lock the scroll of the webpage  because the animation is playing
                    this.disableScroll();
                } else {  // unlock the scroll of the webpage
                    this.enableScroll();
                }

                if (this.currentAnimationStage < stages.length) {
                    const event = pointerInfo.event as WheelEvent;
                    const deltaY = event.deltaY;

                    if (deltaY > 0) { // wheel down (100)
                        if (this.currentFrame < stages[this.currentAnimationStage].end) {
                            this.currentFrame = Math.min(this.currentFrame + 1, stages[this.currentAnimationStage].end);
                        } else if (this.currentAnimationStage < stages.length - 1) {
                            isScrollable = false;
                            setTimeout(() => {
                                isScrollable = true;
                            }, 1500);

                            this.currentAnimationStage++;
                            this.currentFrame = stages[this.currentAnimationStage].start;

                            this.applyCameraAnimationsForStage(this.currentAnimationStage);
                        }
                    }
                    else {  // wheel up (-100)
                        if (this.currentFrame > stages[this.currentAnimationStage].start) {
                            this.currentFrame = Math.max(this.currentFrame - 1, stages[this.currentAnimationStage].start);
                        } else if (this.currentAnimationStage > 0) {
                            isScrollable = false;
                            setTimeout(() => {
                                isScrollable = true;
                            }, 1500);

                            this.currentAnimationStage--;
                            this.currentFrame = stages[this.currentAnimationStage].end;

                            this.applyCameraAnimationsForStage(this.currentAnimationStage);
                        }
                    }

                    switch (this.currentAnimationStage) {
                        case 0: // Play an animation to make the orange box getting bigger
                            this.beginAnimation(this.box_orange, this.currentFrame, this.currentFrame, false, 1);

                            break;
                        case 1: // Play an animation that grows as the orange box rotates, that moves the camera's position
                            this.beginAnimation(this.freeCamera, this.currentFrame, this.currentFrame, false, 1);
                            this.beginDirectAnimation(this.box_orange, [anim_boxOragneScale2, anim_boxOrangeRotationZ], this.currentFrame, this.currentFrame, false, 1);

                            break;
                        case 2: // Play an animation with green box coming down as scale changes from top to bottom
                            this.beginAnimation(this.box_green, this.currentFrame, this.currentFrame, false, 1);

                            break;
                        case 3: // Play an animation that shows the computer asset as the camera falls back while looking at the green box
                            if (this.currentFrame === 75) {
                                this.model!.setEnabled(true);
                                this.box_orange!.setEnabled(false);
                            }
                            else if (this.currentFrame === 76) {
                                this.directionalLight!.intensity = 0;
                            }
                            else if (this.currentFrame === 77) {
                                this.directionalLight!.intensity = 3;
                            }

                            this.beginAnimation(this.freeCamera, this.currentFrame, this.currentFrame, false, 1);

                            break;
                        case 4:
                            break;
                        default:
                            break;
                    }

                    // Additional control conditions according to animation forward/reverse playback
                    if (newStage !== previousStage) { // forward playing (wheel down)
                        if (newStage > previousStage) {
                            switch (newStage) {
                                case 0:
                                    break;
                                case 1:
                                    break;
                                case 2:
                                    break;
                                case 3:
                                    break;
                                case 4:
                                    if (this.arcRotateCamera) {
                                        this.arcRotateCamera.alpha = 4.712;
                                        this.arcRotateCamera.beta = 1.175;
                                        this.arcRotateCamera.attachControl(this.engine.getRenderingCanvas(), true);
                                        this.activeCamera = this.arcRotateCamera;
                                    }
                                    break;
                            }
                        }
                        else {  // reverse playing (wheel up)
                            switch (newStage) {
                                case 0:
                                    break;
                                case 1:
                                    if (this.box_orange) this.box_orange.setEnabled(true);
                                    if (this.model) this.model.setEnabled(false);
                                    break;
                                case 2:
                                    this.directionalLight!.intensity = 0;
                                    break;
                                case 3:
                                    this.arcRotateCamera!.alpha = 4.712;
                                    this.arcRotateCamera!.beta = 1.175;
                                    this.arcRotateCamera!.detachControl();

                                    this.activeCamera = this.freeCamera;

                                    break;
                            }
                        }

                        lastAnimationStage = this.currentAnimationStage;
                    }
                }
            }
        });

        SceneLoader.ImportMesh("", "/assets/", "computer.glb", this, (meshes, particleSystems, skeletons, animations) => {
            this.model = meshes[0];

            this.model.rotation.y = Tools.ToRadians(210);
            this.model.position = new Vector3(0.17, -1.05, -0.37);
            this.model.setEnabled(false);

            const shadowGenerator = new ShadowGenerator(1024, this.directionalLight!);
            shadowGenerator.useContactHardeningShadow = true;

            // set a shadow condition of computer box mesh
            this.computerBox = this.model.getChildTransformNodes(false, n => n.name === "box")[0];
            if (this.computerBox) {
                this.computerBox.getChildMeshes().forEach(m => {
                    if (m.getTotalVertices() > 0) {

                        if (m.name.includes("boxtop")) {
                            m.receiveShadows = true;
                        } else {
                            shadowGenerator.addShadowCaster(m);
                        }
                    }
                })
            }

            // set a shadow condition of computer meshes
            this.model.getChildMeshes().forEach(m => {
                if (m.material) m.material.backFaceCulling = false;

                if (m.name === "pad" || m.name === "carpet") {
                    m.receiveShadows = true;
                } else {
                    if (!m.isDescendantOf(this.computerBox!)) {
                        shadowGenerator.addShadowCaster(m);
                    }
                }
            });
        });
    }

    applyCameraAnimationsForStage(stage: number) {
        if (this.freeCamera) {
            this.freeCamera.animations = [];

            if (this.cameraAnimations[stage]) {
                this.cameraAnimations[stage].forEach((animation: Animation) => {
                    this.freeCamera!.animations.push(animation);
                });
            }
        }
    }

    disableScroll() {
        document.body.style.overflow = 'hidden';
        document.body.addEventListener('touchmove', this.preventTouchMove, { passive: false });
    }

    preventTouchMove(e: { preventDefault: () => void; }) {
        e.preventDefault();
    }

    enableScroll() {
        document.body.style.overflow = '';
        document.body.removeEventListener('touchmove', this.preventTouchMove);
    }

    setGUIForTest() {
        // GUI for test
        const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

        // textBlock to show the wheel direction
        this.textBlock = new GUI.TextBlock();
        this.textBlock.text = this.currentAnimationStage.toString();
        this.textBlock.color = "black";
        this.textBlock.fontSize = 24;
        this.textBlock.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.textBlock.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.textBlock.paddingTop = "10px";
        this.textBlock.paddingLeft = "10px";

        this.textBlock2 = new GUI.TextBlock();
        this.textBlock2.text = this.currentFrame.toString();
        this.textBlock2.color = "black";
        this.textBlock2.fontSize = 24;
        this.textBlock2.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.textBlock2.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.textBlock2.paddingTop = "40px";
        this.textBlock2.paddingLeft = "10px";

        this.textBlock3 = new GUI.TextBlock();
        this.textBlock3.text = "";
        this.textBlock3.color = "black";
        this.textBlock3.fontSize = 24;
        this.textBlock3.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.textBlock3.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.textBlock3.paddingTop = "70px";
        this.textBlock3.paddingLeft = "10px";

        this.textBlock4 = new GUI.TextBlock();
        this.textBlock4.text = "";
        this.textBlock4.color = "black";
        this.textBlock4.fontSize = 24;
        this.textBlock4.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.textBlock4.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.textBlock4.paddingTop = "100px";
        this.textBlock4.paddingLeft = "10px";

        advancedTexture.addControl(this.textBlock);
        advancedTexture.addControl(this.textBlock2);
        advancedTexture.addControl(this.textBlock3);
        advancedTexture.addControl(this.textBlock4);
    }
}
export default Scene2;
