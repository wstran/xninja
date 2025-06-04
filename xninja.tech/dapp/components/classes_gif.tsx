export const CLASSES_STYLE: { [key: string]: { main_panel: string; option_panel: string; upgrade_panel: string } } = {
    metal: { main_panel: 'w-24 mt-[34px]', option_panel: 'w-16', upgrade_panel: 'self-center w-[70px] mt-2 ml-2 absolute' },
    wood: { main_panel: 'w-24 mt-[22px]', option_panel: 'w-16 mb-10', upgrade_panel: 'self-center w-[70px] absolute' },
    fire: { main_panel: 'w-32 mt-[37px]', option_panel: '', upgrade_panel: 'self-center w-[100px] mt-2 absolute' },
    water: { main_panel: 'w-32 mt-[44px]', option_panel: '', upgrade_panel: 'self-center w-[100px] mt-2 absolute' },
    earth: { main_panel: 'w-32 mt-[44px]', option_panel: '', upgrade_panel: 'self-center w-[100px] mt-2 absolute' },
};

export const MainPanel = ({ ninja_class }: { ninja_class: string }) => {
    return <img className={CLASSES_STYLE[ninja_class].main_panel} src={`/assets/ninjas/${ninja_class}.gif`} />;
};

export const OptionPanel = ({ ninja_class }: { ninja_class: string }) => {
    return <img className={CLASSES_STYLE[ninja_class].option_panel} src={`/assets/ninjas/${ninja_class}.gif`} />;
};

export const UpgradePanel = ({ ninja_class }: { ninja_class: string }) => {
    return <img className={CLASSES_STYLE[ninja_class].upgrade_panel} src={`/assets/ninjas/${ninja_class}.gif`} />;
};
