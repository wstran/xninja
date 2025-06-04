import { useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import axiosApi from '../libs/axios';
import { signOut } from '../../hooks/useMeQuery';

export const Index = ({ reloadMe }: { reloadMe: () => void }) => {
    const [active, setActive] = useState<boolean>(false);
    const [animationActive, setAnimationActive] = useState<boolean>(false);
    const [isOpened, setIsOpened] = useState<boolean>(false);
    const [ninja, setNinjas] = useState<{ class: string; mana: string } >();

    useEffect(() => {
        toast.remove();
    }, []);

    useEffect(() => {
        if (animationActive === true) {
            const timeoutId = setTimeout(() => setAnimationActive(false), 500);

            return () => clearTimeout(timeoutId);
        };
    }, [animationActive]);

    return (
        <>
            <div className="mt-5 flex flex-col text-black items-center font-ibm">
                <div className="pb-5 pl-5 flex w-full max-w-[375px] xxs:max-w-[430px] xs:max-w-[500px]">
                    <div className="flex cursor-pointer" onClick={() => signOut(reloadMe)}>
                        <svg className="mt-[2px]" xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 512 512" fill="#e7515a">
                            <path d="M48 256a208 208 0 1 1 416 0A208 208 0 1 1 48 256zm464 0A256 256 0 1 0 0 256a256 256 0 1 0 512 0zM217.4 376.9c4.2 4.5 10.1 7.1 16.3 7.1c12.3 0 22.3-10 22.3-22.3V304h96c17.7 0 32-14.3 32-32V240c0-17.7-14.3-32-32-32H256V150.3c0-12.3-10-22.3-22.3-22.3c-6.2 0-12.1 2.6-16.3 7.1L117.5 242.2c-3.5 3.8-5.5 8.7-5.5 13.8s2 10.1 5.5 13.8l99.9 107.1z" />
                        </svg>
                        <span className={`ml-2 text-base font-bold !text-danger`}>Logout</span>
                    </div>
                </div>
                <span className="text-center text-2xl font-bold">Congratulations!</span>
                <span className="text-center text-2xl font-bold">You got a free xNinja Chest.</span>
                <div
                    className="mt-5 transition-all duration-100 hover:cursor-pointer px-2 py-1 w-[250px] h-[250px] bg-[#cbcbcb] rounded-md"
                >
                    <div className="w-full h-full flex flex-col justify-center">
                        <div className="absolute h-[234px] w-[234px] mt-2 flex-col">
                            <div className='flex w-full justify-between'>
                                {isOpened && <span className="inline-flex items-center rounded-md bg-white border bg-opacity-30 m-1 px-[4px] text-[10px] font-medium font-ibm text-gray">LV 0</span>}
                                {isOpened && <span className="inline-flex items-center rounded-md bg-white border bg-opacity-30 m-1 px-[4px] text-[10px] font-medium font-ibm text-gray">Ninja</span>}
                            </div>
                        </div>
                        <div className="w-full h-full flex flex-col justify-center items-center">
                            {!isOpened && <img className={`${animationActive ? 'animate-ping' : 'animate-bounce'} w-[200px] mt-2`} src={'https://xninja.s3.ap-southeast-1.amazonaws.com/images/chest.svg'} />}
                            {ninja && <img className={`w-[200px] mb-12`} src={`https://xninja.s3.ap-southeast-1.amazonaws.com/images/${ninja.class}-idle.gif`} />}
                        </div>
                        <div className="absolute h-[234px] w-[234px] mt-2 flex-col">
                            <div className='flex pt-[85%] justify-between'>
                                {(isOpened && ninja) && <span className="inline-flex items-center rounded-md bg-white border bg-opacity-30 m-1 px-[4px] text-[10px] font-medium font-ibm text-gray">Class: {ninja.class[0].toUpperCase() + ninja.class.slice(1, ninja.class.length)}</span>}
                                {(isOpened && ninja) && <span className="inline-flex items-center space-x-1 rounded-md bg-white border bg-opacity-30 m-1 px-[4px] text-[10px] font-medium font-ibm text-gray">
                                    {Array.from({ length: Math.ceil((Date.parse(ninja.mana) - Date.now() - 1000) / (8 * 60 * 60 * 1000)) }).map((_, index) => (
                                        <svg key={index} width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg" >
                                            <rect x="4.36365" y="4.36426" width="1.45455" height="1.45453" fill="#140C1C" />
                                            <rect x="2.90912" y="5.81836" width="1.45455" height="1.45453" fill="#140C1C" />
                                            <rect x="1.45453" y="7.27246" width="1.45455" height="1.45453" fill="#140C1C" />
                                            <rect y="8.72754" width="1.45455" height="4.36359" fill="#140C1C" />
                                            <rect x="1.45453" y="13.0908" width="1.45455" height="1.45453" fill="#140C1C" />
                                            <rect x="2.90912" y="14.5459" width="8.72728" height="1.45453" fill="#140C1C" />
                                            <rect x="11.6364" y="13.0908" width="1.45455" height="1.45453" fill="#140C1C" />
                                            <rect x="13.0909" y="8.72754" width="1.45455" height="4.36359" fill="#140C1C" />
                                            <rect x="11.6364" y="7.27246" width="1.45455" height="1.45453" fill="#140C1C" />
                                            <rect x="10.1818" y="5.81836" width="1.45455" height="1.45453" fill="#140C1C" />
                                            <rect x="8.72729" y="4.36426" width="1.45455" height="1.45453" fill="#140C1C" />
                                            <rect x="10.1818" y="1.4541" width="1.45455" height="2.90906" fill="#140C1C" />
                                            <rect x="4.36365" width="5.81818" height="1.45453" fill="#140C1C" />
                                            <rect x="2.90912" y="1.4541" width="1.45455" height="2.90906" fill="#140C1C" />
                                            <rect x="4.36365" y="1.4541" width="1.45455" height="1.45453" fill="#D27D2C" />
                                            <rect x="5.81818" y="1.4541" width="2.90909" height="1.45453" fill="#854C30" />
                                            <rect x="8.72729" y="1.4541" width="1.45455" height="1.45453" fill="#442434" />
                                            <rect x="4.36365" y="2.90918" width="2.90909" height="1.45453" fill="#854C30" />
                                            <rect x="7.27271" y="2.90918" width="2.90909" height="1.45453" fill="#442434" />
                                            <rect x="5.81818" y="4.36426" width="2.90909" height="1.45453" fill="#757161" />
                                            <rect x="4.36365" y="5.81836" width="4.36364" height="1.45453" fill="#757161" />
                                            <rect x="8.72723" y="5.81836" width="1.45455" height="1.45453" fill="#4E4A4E" />
                                            <rect x="2.90912" y="7.27246" width="1.45455" height="1.45453" fill="#757161" />
                                            <rect x="5.81818" y="7.27246" width="4.36364" height="1.45453" fill="#757161" />
                                            <rect x="10.1818" y="7.27246" width="1.45455" height="1.45453" fill="#4E4A4E" />
                                            <rect x="4.36365" y="7.27246" width="1.45455" height="2.90906" fill="#DEEED6" />
                                            <rect x="2.90912" y="8.72754" width="1.45455" height="1.45453" fill="#DEEED6" />
                                            <rect x="1.45453" y="8.72754" width="1.45455" height="4.36359" fill="#757161" />
                                            <rect x="2.90912" y="10.1816" width="1.45455" height="2.90906" fill="#D04648" />
                                            <rect x="4.36365" y="10.1816" width="7.27273" height="1.45453" fill="#D04648" />
                                            <rect x="5.81818" y="8.72754" width="4.36364" height="1.45453" fill="#D04648" />
                                            <rect x="10.1818" y="8.72754" width="1.45455" height="1.45453" fill="#442434" />
                                            <rect x="11.6364" y="8.72754" width="1.45455" height="2.90906" fill="#757161" />
                                            <rect x="11.6364" y="11.6367" width="1.45455" height="1.45453" fill="#4E4A4E" />
                                            <rect x="10.1818" y="11.6367" width="1.45455" height="1.45453" fill="#442434" />
                                            <rect x="8.72729" y="11.6367" width="1.45455" height="1.45453" fill="#D04648" />
                                            <rect x="7.27271" y="11.6367" width="1.45455" height="1.45453" fill="#442434" />
                                            <rect x="5.81818" y="11.6367" width="1.45455" height="1.45453" fill="#D04648" />
                                            <rect x="4.36365" y="11.6367" width="1.45455" height="1.45453" fill="#442434" />
                                            <rect x="2.90912" y="13.0908" width="1.45455" height="1.45453" fill="#4E4A4E" />
                                            <rect x="10.1818" y="13.0908" width="1.45455" height="1.45453" fill="#4E4A4E" />
                                            <rect x="4.36365" y="13.0908" width="5.81818" height="1.45453" fill="#757161" />
                                        </svg>
                                    ))}
                                </span>}
                            </div>
                        </div>
                    </div>
                </div>
                {!isOpened ? <button
                    className="btn mt-10 h-[50px] w-[350px] rounded-full p-2 px-5 text-base font-bold text-white bg-dark hover:bg-dark/90"
                    disabled={active}
                    onClick={() => {
                        setActive(true);
                        setAnimationActive(true);

                        axiosApi
                            .post(`${import.meta.env.VITE_API_URL}/api/claim_first_chest`)
                            .then((response) => {
                                setNinjas(response.data);
                                setIsOpened(true);
                            })
                            .catch((error) => {
                                if (error.response.status === 403) signOut(reloadMe);
                                if (error.response.status === 404) toast.error('Invalid action!', { duration: 3000, className: 'font-ibm text-xs' });
                            })
                            .finally(() => setActive(false));
                    }}
                >
                    {active && <svg
                        stroke="currentColor"
                        fill="currentColor"
                        strokeWidth="0"
                        version="1.1"
                        viewBox="0 0 16 16"
                        className="animate-spin mr-1"
                        height="1em"
                        width="1em"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path d="M8 0c-4.355 0-7.898 3.481-7.998 7.812 0.092-3.779 2.966-6.812 6.498-6.812 3.59 0 6.5 3.134 6.5 7 0 0.828 0.672 1.5 1.5 1.5s1.5-0.672 1.5-1.5c0-4.418-3.582-8-8-8zM8 16c4.355 0 7.898-3.481 7.998-7.812-0.092 3.779-2.966 6.812-6.498 6.812-3.59 0-6.5-3.134-6.5-7 0-0.828-0.672-1.5-1.5-1.5s-1.5 0.672-1.5 1.5c0 4.418 3.582 8 8 8z"></path>
                    </svg>}
                    Open
                </button> : <button
                    className="btn mt-10 h-[50px] w-[350px] rounded-full p-2 px-5 text-base font-bold text-white bg-dark hover:bg-dark/90"
                    disabled={active}
                    onClick={() => {
                        reloadMe();
                    }}
                >
                    Back to Home
                </button>}
            </div>
            <Toaster />
        </>
    );
};

export default Index;
