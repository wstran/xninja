const Index = () => {
    const handleLogin = () => {
        window.location.href = `${import.meta.env.VITE_API_URL}/auth2/twitter`;
    };    
    return (
        <div className="mt-10 flex flex-col items-center font-ibm">
            <img src={'https://xninja.s3.ap-southeast-1.amazonaws.com/images/logo.png'} width={200} height={200} />
            <span className="text-center text-lg font-ibm font-bold text-black mt-10">Train your Ninja, Fight & Take profit on Twitter</span>
            <button className="mt-10 h-[50px] w-[350px] rounded-full p-2 px-5 text-base font-bold text-white bg-dark hover:bg-dark/90" onClick={handleLogin}>
                Sign in
            </button>
        </div>
    );
};

export default Index;
