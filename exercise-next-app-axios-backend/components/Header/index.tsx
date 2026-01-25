import Link from "next/link"

export const Header = () => {
  return (
    <header className="flex justify-center w-full h-16 bg-blue-600 text-white items-center">
        <h1 className="text-2xl font-bold">Company Name</h1>
        <nav className="flex gap-4 ml-8">
            <ul className="flex gap-4">
                <li><Link href="/" className="hover:teal-900 hover:text-teal-700">Home</Link></li>
                <li><Link href="/about" className="hover:teal-900 hover:text-teal-700">About</Link></li>
                <li><Link href="/blog" className="hover:teal-900 hover:text-teal-700">Blog</Link></li>
            </ul>
        </nav>
    </header>
  )
}