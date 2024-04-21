import Link from "next/link";

export default function Navbar() {
    return (

        <div className="fixed w-full flex justify-between items-center text-white p-5 bg-zinc-900" id="navbar">
            <div id="logo" className="w-5">Webmotion</div>
            <ul id="navigation" className="flex justify-evenly items-center gap-10">
                <li className=" ">Home</li>
                <Link href={"/audio-input"}>
                    <li className=" " > Predict</li>
                </Link>
                <li className=" ">About</li>
            </ul>
        </div>
    );
}
