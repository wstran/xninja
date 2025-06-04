export const CLASSES_STYLE: { [key: string]: { main_panel: string; option_panel: string; upgrade_panel: string } } = {
    metal: { main_panel: 'w-28', option_panel: 'absolute inset-0', upgrade_panel: 'self-center w-[70px] mt-2 ml-2 absolute' },
    wood: { main_panel: 'w-28 mb-4', option_panel: 'absolute inset-0', upgrade_panel: 'self-center w-[70px] absolute' },
    fire: { main_panel: 'w-40', option_panel: 'absolute inset-0', upgrade_panel: 'self-center w-[100px] mt-2 absolute' },
    water: { main_panel: 'w-40', option_panel: 'absolute inset-0', upgrade_panel: 'self-center w-[100px] mt-2 absolute' },
    earth: { main_panel: 'w-40', option_panel: 'absolute inset-0', upgrade_panel: 'self-center w-[100px] mt-2 absolute' },
};

export const MainPanel = ({ ninja_class }: { ninja_class: string }) => {
    return <div className="absolute w-full h-full items-center inset-0 flex justify-center">
        <img className={CLASSES_STYLE[ninja_class].main_panel} style={{ zIndex: 0 }} src={`https://xninja.s3.ap-southeast-1.amazonaws.com/images/ninjas/${ninja_class}.gif`} />
    </div>
};

export const OptionPanel = ({ ninja_class }: { ninja_class: string }) => {
    return <img className={CLASSES_STYLE[ninja_class].option_panel} style={{ zIndex: 0 }} src={`https://xninja.s3.ap-southeast-1.amazonaws.com/images/${ninja_class}-idle.gif`} />;
};

export const UpgradePanel = ({ ninja_class }: { ninja_class: string }) => {
    return <img className={CLASSES_STYLE[ninja_class].upgrade_panel} style={{ zIndex: 0 }} src={`https://xninja.s3.ap-southeast-1.amazonaws.com/images/ninjas/${ninja_class}.gif`} />;
};