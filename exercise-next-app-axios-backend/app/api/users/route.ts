export async function GET(request: Request) {
  console.log("request", request);
  const users = [
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
    { id: 3, name: "Charlie" },
  ];

//   return new Response(JSON.stringify(users), {
//     headers: { "Content-Type": "application/json" },
//   });
  return Response.json(users);
}