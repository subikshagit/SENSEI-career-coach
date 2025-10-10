import React from "react";

const CoverLetter = async ({ params }) => {
  const { id } = await params; // ✅ await params before using it

  return (
    <div>
      <h1 className="containter mx-auto mt-24 text-center">Cover Letter ID: {id}</h1>
    </div>
  );
};

export default CoverLetter;
