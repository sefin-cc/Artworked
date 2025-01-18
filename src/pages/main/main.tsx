import React, { useEffect, useState } from 'react';
import { getDocs, collection, query, orderBy, Timestamp  } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Post } from './posts/post';
import { CreateForm } from './posts/create-post/create-form';
import { LoadingScreen } from '../../components/loadingscreen';




export interface Post {
    id: string;
    userId: string;
    username: string;
    title: string;
    description: string;
    userPhotoUrl: string;
    imagepost:string;
    createdAt: Timestamp;
}

export const Main = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [postsList, setPostList] = useState<Post[] | null>(null);
    const postsRef = collection(db, "posts");
    //get the data from the  collection
    const getPost = async () => {
        try {
            setIsLoading(true); 
            const postQuery = query(postsRef, orderBy("createdAt", "desc")); // Order by 'createdAt' in descending order
            const data = await getDocs(postQuery);
    
            // Map the data and set it to the state
            setPostList(
                data.docs.map((doc) => ({
                    ...doc.data(),
                    id: doc.id,
                })) as Post[]
            );
          } catch (error) {
            console.error("Error fetching posts:", error);
          } finally {
            setIsLoading(false); // Always reset loading state
          }
    }

    //load the getPost() once the page is refreshed
    useEffect(() => {getPost();},[])

    


    return (
        <div className="flex overflow-hidden "  style={{ height: 'calc(100vh - 64px)' }}>
            <div className="flex flex-col w-full  overflow-y-auto h-full scrollbar-thin scrollbar-thumb-secondary scrollbar-track-transparent scrollbar-thumb-rounded-full scrollbar-track-rounded-full  ">
                {postsList?.map((post) => (
                  <Post key={post.id} post={post} />
                ))}

                <CreateForm />
              
                {isLoading && <LoadingScreen />}
            </div>
        </div>
    );
};

