import React, { useEffect, useRef, useState } from "react";
import css from "./MainContent.module.scss";
import BJSCanvas from "../pages/BJSCanvas";
import { Engine } from "@babylonjs/core";
import Scene1 from "../3D/Scene1";

const MainContent: React.FC = () => {
    const [scene, setScene] = useState<Scene1 | null>(null);
    const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement>();
    const scrollIndicatorRef = useRef<HTMLDivElement>(null);

    let mainScene: Scene1 | null = null;

    const onCanvasLoad = (engine: Engine, canvas?: HTMLCanvasElement) => {
        if (engine && canvas) {
            setCanvasElement(canvas);
            mainScene = new Scene1(engine);
            setScene(mainScene);
        }
    };

    useEffect(() => {
        const checkScroll = () => {
            if (scrollIndicatorRef.current && window.scrollY > 0) {
                scrollIndicatorRef.current.style.display = 'none';
            } else if(scrollIndicatorRef.current) {
                scrollIndicatorRef.current.style.display = 'flex';
            }
        };

        window.addEventListener('scroll', checkScroll);

        return () => {
            window.removeEventListener('scroll', checkScroll);
        };
    }, []);

    return (
        <>
            <div className={css.container}>
                <div className={css.mainContent}>
                    <h1 className={css.title}>ENJOY TUTORIAL</h1>
                    <button className={css.tryFreeButton}>Let's Start →</button>
                </div>
                <BJSCanvas onLoad={onCanvasLoad} type={"Scene1"} />
                <div className={css.memo}>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</div>
                <div className={css.scrollDownIndicator} ref={scrollIndicatorRef}>
                    <span className={css.arrowDown}></span>
                    <span className={css.arrowDown}></span>
                </div>
            </div>

            <div className={css.imageContainer}>
                <div className={css.imageContent}>
                    <img className={css.imageLeft} src="/images/landscape.jpg" alt="Landscape" />
                    <p className={css.textRight}>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
                </div>

                <div className={css.imageContent}>
                    <p className={css.textLeft}>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>
                    <img className={css.imageRight} src="/images/laptop.jpg" alt="Laptop" />
                </div>
            </div>
        </>
    );
}

export default MainContent;