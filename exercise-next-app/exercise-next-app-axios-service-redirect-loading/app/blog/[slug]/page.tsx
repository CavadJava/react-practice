import { ReadMoreBtn } from "@/components/ReadMore";
import { fetchBlogById } from "@/services/blog.api.js";

export default async function BlogPostPage(
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;

    const blogResponse = await fetchBlogById(slug);
    console.log("Blog Response:", blogResponse);
    

    return (
        
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black flex flex-col">

            <ReadMoreBtn to="/blog">Go Back to Blog</ReadMoreBtn> 
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">{blogResponse.title}:{slug}</h1>
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed max-w-2xl">{blogResponse.body}</p>
        </div>
    );
}