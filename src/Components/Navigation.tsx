import React, { useState } from "react";
import css from "./Navigation.module.scss";

const Navigation: React.FC = () => {
    const [isMenuVisible, setIsMenuVisible] = useState(false);

    const toggleMenu = () => {
        setIsMenuVisible(!isMenuVisible);
    };

    return (
        <header>
            <div className={css.headerDiv}>
                <div className={css.logoDiv}>
                    <div className={css.logoTitle}>Lorem ipsum</div>
                </div>

                <div className={isMenuVisible ? [css.hamburger, css.open].filter(e=>!!e).join(' ') : css.hamburger} onClick={toggleMenu}>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>

                <nav>
                    <ul className={isMenuVisible ? css.showMenu : ''}>
                        <li>HOME</li>
                        <li>PORTFOLIO</li>
                        <li>CAREERS</li>
                        <li>CONTACT</li>
                    </ul>
                </nav>
            </div>
        </header>
    );
}

export default Navigation;