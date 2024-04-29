import Link from "next/link";

export default function Navbar() {
    return (
        <div
            className="fixed w-full flex justify-between items-center text-white p-5 "
            id="navbar"
        >
            <div id="logo" className="w-5">
                Webmotion
            </div>
            <ul
                id="navigation"
                className="flex justify-evenly items-center gap-10"
            >
                {/* <Link href={"/"}>
                    <li className=" ">Home</li>
                </Link> */}
                {/* <Link href={"/audio-input"}>
                    <li className=" "> Predict</li>
                </Link> */}
                {/* <li className=" ">About</li> */}
            </ul>
        </div>
    );
}
