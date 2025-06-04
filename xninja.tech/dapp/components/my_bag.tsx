import { setShowHeader } from '@/store/themeConfigSlice';
import { ReactNode, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Mana } from '@/components/svg';
import axios from 'axios';
import { signOut } from 'next-auth/react';
import { CONFIG_FOODS } from '@/libs/game.config';

type PANEL_BOX = { children: ReactNode; hoverChildren: ReactNode };

const PanelBox = ({ children, hoverChildren }: PANEL_BOX) => {
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => setIsHovered(false);

    return (
        <div
            className="ml-[5px] mt-[5px] transition-all duration-100 hover:mt-[2px] hover:cursor-pointer px-2 py-1 w-[120px] h-[120px] bg-[#f5f5f4] rounded-md"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {isHovered && hoverChildren}
            {children}
        </div>
    );
};

const Index = ({ closeBag, onUse }: { closeBag: () => void; onUse: (item: string) => void }) => {
    const dispatch = useDispatch();
    const [bags, setBags] = useState({ rice: 0, miso_soup: 0, meat: 0 });

    useEffect(() => {
        dispatch(setShowHeader(false));
    });

    useEffect(() => {
        axios
            .post('/api/game/bag')
            .then((response) => setBags(response.data))
            .catch((error) => {
                error.response.status === 403 && signOut({ callbackUrl: '/' });
            });
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
            <div className="flex flex-col">
                <div className="mb-5 flex">
                    <svg
                        onClick={() => {
                            closeBag();
                            dispatch(setShowHeader(true));
                        }}
                        className="hover:cursor-pointer mt-1"
                        xmlns="http://www.w3.org/2000/svg"
                        height="20"
                        width="20"
                        viewBox="0 0 512 512"
                        fill={'#000'}
                    >
                        <path d="M48 256a208 208 0 1 1 416 0A208 208 0 1 1 48 256zm464 0A256 256 0 1 0 0 256a256 256 0 1 0 512 0zM217.4 376.9c4.2 4.5 10.1 7.1 16.3 7.1c12.3 0 22.3-10 22.3-22.3V304h96c17.7 0 32-14.3 32-32V240c0-17.7-14.3-32-32-32H256V150.3c0-12.3-10-22.3-22.3-22.3c-6.2 0-12.1 2.6-16.3 7.1L117.5 242.2c-3.5 3.8-5.5 8.7-5.5 13.8s2 10.1 5.5 13.8l99.9 107.1z" />
                    </svg>
                    <span className={`ml-2 text-xl font-bold text-black font-pixel`}>Home</span>
                </div>

                <div className="flex flex-wrap mt-5 max-w-[375px] overflow-y-auto scrollbar-hide">
                    {bags.rice > 0 && (
                        <PanelBox
                            hoverChildren={
                                <div className="absolute flex flex-col w-[100px] mt-10 items-center">
                                    <button className="btn bg-[#f5f5f4] text-black w-[70px] h-[30px] rounded-full font-pixel outline-none" onClick={() => onUse(CONFIG_FOODS.rice.food)}>
                                        Use
                                    </button>
                                </div>
                            }
                        >
                            <div className="w-full h-full flex flex-col items-center">
                                <div className="flex w-full justify-end">
                                    <span className="inline-flex items-center rounded-md bg-gray-400 bg-opacity-20 mt-[2px] px-[4px] text-[10px] font-medium font-pixel text-gray">{bags.rice}x</span>
                                </div>
                                <img className="w-12" src={CONFIG_FOODS.rice.image} />
                                <div className="flex mt-2">
                                    {' '}
                                    {Array.from({ length: CONFIG_FOODS.rice.mana }).map((_, index) => (
                                       <Mana key={index} />
                                    ))}
                                </div>
                            </div>
                        </PanelBox>
                    )}
                    {bags.miso_soup > 0 && (
                        <PanelBox
                            hoverChildren={
                                <div className="absolute flex flex-col w-[100px] mt-10 items-center">
                                    <button className="btn bg-[#f5f5f4] text-black w-[70px] h-[30px] rounded-full font-pixel outline-none" onClick={() => onUse(CONFIG_FOODS.miso_soup.food)}>
                                        Use
                                    </button>
                                </div>
                            }
                        >
                            <div className="w-full h-full flex flex-col items-center">
                                <div className="flex w-full justify-end">
                                    <span className="inline-flex items-center rounded-md bg-gray-400 bg-opacity-20 mt-[2px] px-[4px] text-[10px] font-medium font-pixel text-gray">
                                        {bags.miso_soup}x
                                    </span>
                                </div>
                                <img className="w-12" src={CONFIG_FOODS.miso_soup.image} />
                                <div className="flex mt-2">
                                    {' '}
                                    {Array.from({ length: CONFIG_FOODS.miso_soup.mana }).map((_, index) => (
                                      <Mana key={index} />
                                    ))}
                                </div>
                            </div>
                        </PanelBox>
                    )}
                    {bags.meat > 0 && (
                        <PanelBox
                            hoverChildren={
                                <div className="absolute flex flex-col w-[100px] mt-10 items-center">
                                    <button className="btn bg-[#f5f5f4] text-black w-[70px] h-[30px] rounded-full font-pixel outline-none" onClick={() => onUse(CONFIG_FOODS.meat.food)}>
                                        Use
                                    </button>
                                </div>
                            }
                        >
                            <div className="w-full h-full flex flex-col items-center">
                                <div className="flex w-full justify-end">
                                    <span className="inline-flex items-center rounded-md bg-gray-400 bg-opacity-20 mt-[2px] px-[4px] text-[10px] font-medium font-pixel text-gray">{bags.meat}x</span>
                                </div>
                                <img className="w-12" src={CONFIG_FOODS.meat.image} />
                                <div className="flex mt-2">
                                    {' '}
                                    {Array.from({ length: CONFIG_FOODS.meat.mana }).map((_, index) => (
                                        <Mana key={index} />
                                    ))}
                                </div>
                            </div>
                        </PanelBox>
                    )}
                </div>
            </div>
        </>
    );
};

export default Index;
