import useDigitInput from 'react-digit-input';

export default function TwoFactAuth({ value, onChange }: { value: string; onChange: (value: string) => void }) {
    const digits = useDigitInput({
        acceptedCharacters: /^[0-9]$/,
        length: 6,
        value,
        onChange,
    });

    return (
        <div className="flex justify-center items-center font-ibm">
            {digits.map((digit, index) => (
                <input
                    key={index}
                    type="text"
                    className="h-12 w-12 text-xl text-center m-1 w-full px-1 rounded-md min-w-0 outline-transparent outline-2 outline-offset-2 relative appearance-none transition duration-200 border-4 border-solid border-inherit bg-inherit mr-1 focus-visible:z-10 focus-visible:border-blue-500 focus-visible:shadow-[0_0_0_1px_rgb(49,130,206)]"
                    inputMode="decimal"
                    autoComplete="one-time-code"
                    autoFocus={index === 0}
                    {...digit}
                />
            ))}
        </div>
    );
}
