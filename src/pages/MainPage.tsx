import React, { useEffect, useState } from 'react';
import Scene2 from '../3D/Scene2';
import { Engine } from '@babylonjs/core';
import BJSCanvas from './BJSCanvas';
import Navigation from '../Components/Navigation';
import MainContent from '../Components/MainContent';

const MainPage: React.FC = () => {
  const [scene, setScene] = useState<Scene2 | null>(null);
  const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement>();
  const [isScrollBottom, setIsScrollBottom] = useState(false);

  let scene2: Scene2 | null = null;
  /*
   * Canvas Init
   */
  const onCanvas2Load = (engine: Engine, canvas?: HTMLCanvasElement) => {
    if (engine && canvas) {
      setCanvasElement(canvas);
      scene2 = new Scene2(engine);
      setScene(scene2);
    }
  };

  const handleScroll = () => {
    // scroll height + viewport height
    const scrolledFromTop = window.scrollY + window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    if (scrolledFromTop + 100 >= documentHeight) {
      // console.log('Reached bottom of the page');
      setIsScrollBottom(true);
    }else{
      if(scene2) scene2.enableScroll();
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <>
      <Navigation />
      <MainContent />
      <BJSCanvas onLoad={onCanvas2Load} type={"Scene2"}></BJSCanvas>
    </>
  );
}

export default MainPage;

