

export default async function getUsers() {
  console.log('Fetching users data...');
  const response = await fetch('https://dummyjson.com/userss');
  if (!response.ok) {
    throw new Error('Failed to fetch users data.');
  }
  return await response.json();
}