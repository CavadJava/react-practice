import { fetchBlogs } from "@/services/blog.api";
import { useRouter } from 'next/router';

export default async function Blog() {
  const router = useRouter();
  const blogs = await fetchBlogs();
  console.log(blogs);

  const handleBlogClick = (id: number) => {
    router.push(`/blog/${id}`); // Adjust the path as needed
  };
  // You have a Server Component that imports next/router. Use next/navigation instead.


  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      Blog Page
      <div className="mt-8 flex flex-col items-center space-y-4">
        {blogs.map((blog: any) => (
          <div 
            key={blog.id} 
            className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-md dark:border-zinc-700 dark:bg-zinc-900 hover:shadow-lg transition-shadow"
            onClick={() => handleBlogClick(blog.id)} // Add click handler
          >
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{blog.title}</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{blog.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}