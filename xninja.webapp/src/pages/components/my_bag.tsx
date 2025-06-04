import { ReactNode, useEffect, useState } from 'react';
import { Mana } from '../components/svg';
import { User, getMeQuery } from '../../hooks/useMeQuery';

type PANEL_BOX = { children: ReactNode; hoverChildren: ReactNode };

const PanelBox = ({ children, hoverChildren }: PANEL_BOX) => {
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => setIsHovered(false);

    return (
        <div
            className="m-1 mt-[5px] transition-all duration-100 hover:mt-[2px] hover:cursor-pointer px-2 py-1 w-[100px] h-[110px] xxs:w-[120px] xxs:h-[125px] xs:w-[145px] xs:h-[145px] bg-[#f5f5f4] rounded-md"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {isHovered && hoverChildren}
            {children}
        </div>
    );
};

const Index = ({ user, closeBag, onUse }: { user: User; closeBag: () => void; onUse: (item: string) => void }) => {
    const [bags, setBags] = useState<{ [key: string]: number }>({ ...user.inventorys });
    const [getBags, setGetBags] = useState<boolean>(false);

    useEffect(() => {
        getMeQuery('inventorys')
            .then((response) => {
                setBags((prev: any) => ({ ...prev, ...response.data.inventorys }));
            })
            .catch((error) => error.response.status === 403 && window.location.reload())
            .finally(() => setGetBags(true));
    }, []);

    const [isCoppy, setIsCoppy] = useState<boolean>(false);

    useEffect(() => {
        let timeoutId: NodeJS.Timeout | undefined;

        if (isCoppy === true) {
            timeoutId = setTimeout(() => setIsCoppy(false), 2000);
        }

        return () => clearTimeout(timeoutId);
    }, [isCoppy]);

    return (
        <>
            <div className="flex flex-col p-5 font-ibm">
                <div className="p-5 flex">
                    <svg
                        onClick={() => closeBag()}
                        className="hover:cursor-pointer mt-1"
                        xmlns="http://www.w3.org/2000/svg"
                        height="20"
                        width="20"
                        viewBox="0 0 512 512"
                        fill={'#000'}
                    >
                        <path d="M48 256a208 208 0 1 1 416 0A208 208 0 1 1 48 256zm464 0A256 256 0 1 0 0 256a256 256 0 1 0 512 0zM217.4 376.9c4.2 4.5 10.1 7.1 16.3 7.1c12.3 0 22.3-10 22.3-22.3V304h96c17.7 0 32-14.3 32-32V240c0-17.7-14.3-32-32-32H256V150.3c0-12.3-10-22.3-22.3-22.3c-6.2 0-12.1 2.6-16.3 7.1L117.5 242.2c-3.5 3.8-5.5 8.7-5.5 13.8s2 10.1 5.5 13.8l99.9 107.1z" />
                    </svg>
                    <span className={`ml-2 text-xl font-bold text-black`}>Back</span>
                </div>
                <div className="flex flex-wrap justify-center overflow-y-auto scrollbar-hide">
                    {(getBags && (!bags || Object.values(bags).findIndex(v => v > 0) === -1)) && (
                        <>
                            <label className="text-xl font-bold text-center mt-4">👉 Your bag is empty.</label>
                            <span className="text-xl font-bold text-center mt-4">Complete Quests or go to Market to get more food, materials & equipments.</span>
                        </>
                    )}
                    {
                        Object.values((user.appConfig.data.CONFIG_FOODS as { [key: string]: { price: number; mana: number; food: string; name: string; image: string } })).map((value, index) => (
                            (!!bags[value.food]) && (
                                <PanelBox
                                    key={index}
                                    hoverChildren={
                                        <div className="absolute flex flex-col w-[85px] xxs:w-[105px] xs:w-[130px] mt-8 xxs:mt-10 xs:mt-12 items-center">
                                            <button className="btn bg-[#f5f5f4] text-black rounded-full font-ibm outline-none" onClick={() => onUse(value.food)}>
                                                Use
                                            </button>
                                        </div>
                                    }
                                >
                                    <div className="w-full h-full flex flex-col items-center">
                                        <div className="flex w-full justify-between">
                                            <span className="inline-flex items-center mt-[2px] px-[4px] text-[10px] font-medium font-ibm text-gray">{value.name}</span>
                                            <span className="inline-flex items-center rounded-md bg-gray-400 bg-opacity-20 mt-[2px] px-[4px] text-[10px] font-medium font-ibm text-gray">{bags[value.food]}x</span>
                                        </div>
                                        <img className="w-12 mt-2" src={value.image} />
                                        <div className="flex mt-2">
                                            {' '}
                                            {Array.from({ length: value.mana }).map((_, index) => (
                                                <Mana key={index} />
                                            ))}
                                        </div>
                                    </div>
                                </PanelBox>
                            )
                        ))
                    }
                </div>
            </div>
        </>
    );
};

export default Index;
