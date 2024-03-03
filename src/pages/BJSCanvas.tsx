import { useEffect, useRef } from "react";
import { Engine, WebGPUEngine } from "@babylonjs/core";
import css from './BJSCanvas.module.scss';
import { GLTFFileLoader } from "@babylonjs/loaders";

type BJSCanvasProps = {
    onLoad: (engine: Engine, canvas?: HTMLCanvasElement) => void
    type: string
}

const BJSCanvas = (props: BJSCanvasProps) => {
    const babylonCanvas = useRef<HTMLCanvasElement>(null);
    const {type} = props;

    useEffect(() => {
        if (babylonCanvas?.current) {
            const engine = new Engine(babylonCanvas.current, true, {premultipliedAlpha: false, preserveDrawingBuffer: true, stencil: true}, true);
            GLTFFileLoader.IncrementalLoading = false;

            const resize = () => {
                if (babylonCanvas?.current && babylonCanvas.current.parentElement) {
                    babylonCanvas.current.width = babylonCanvas.current.parentElement.offsetWidth;
                    babylonCanvas.current.height = babylonCanvas.current.parentElement.offsetHeight;
                }
                engine.resize();
            };
            resize();

            if (window) {
                window.removeEventListener("resize", resize);
                window.addEventListener("resize", resize);
            }

            if (props.onLoad) {
                props.onLoad(engine, babylonCanvas.current);
            }

            return () => {
                engine.dispose();

                if (window) {
                    window.removeEventListener("resize", resize);
                }
            };
        }
    }, [babylonCanvas]);

    return (
        <div className={type === "Scene1" ? css.canvasContainer : css.canvasContainer2}>
            <canvas ref={babylonCanvas}></canvas>
        </div>
    );
};

export default BJSCanvas;