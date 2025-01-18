import React from 'react';
import { Link } from 'react-router-dom';


const NotFound = () => {
  return (
    <div className='w-full h-screen flex justify-center items-center flex-col gap-10 p-5 text-center'>
      <p className='text-5xl '>404 - Page Not Found</p>
      <p>Sorry, the page you are looking for doesn't exist.</p>
      <Link to="/">
        <button className='flex items-center justify-center py-2 px-5 bg-primary  text-white border border-gray-300 rounded-lg  hover:bg-primary-lighter focus:outline-none'>
          Go to Homepage
        </button>
      </Link>
    </div>
  );
};

export default NotFound;