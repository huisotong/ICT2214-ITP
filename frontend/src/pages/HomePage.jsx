import { useEffect, useState } from "react";

function HomePage({ user }) {
  return (
    <>
      <div className="flex justify-center items-center h-12">
        <h1>Welcome, {user.name}!</h1>
      </div>
      <div className="flex justify-between"></div>
    </>
  );
}

export default HomePage;
