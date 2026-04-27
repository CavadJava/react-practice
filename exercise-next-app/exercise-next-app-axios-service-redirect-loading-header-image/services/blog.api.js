export async function fetchBlogs() {
  const response = await fetch('https://jsonplaceholder.typicode.com/posts');
  if (!response.ok) {
    throw new Error('Failed to fetch blogs');
  }
  return response.json();
}

export async function fetchBlogById(id) {
  const response = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch blog with id ${id}`);
  }
  return response.json();
}

export async function createBlog(blogData) {
  const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(blogData),
  });
  if (!response.ok) {
    throw new Error('Failed to create blog');
  }
  return response.json();
}

export async function updateBlog(id, blogData) {
  const response = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(blogData),
  });
  if (!response.ok) {
    throw new Error(`Failed to update blog with id ${id}`);
  }
  return response.json();
}

export async function deleteBlog(id) {
  const response = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`Failed to delete blog with id ${id}`);
  }
  return { message: 'Blog deleted successfully' };
}