import { collection, doc, getDocs, orderBy, query, Timestamp, where } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { db } from "../config/firebase";


interface Props {
    id: string;
}

interface Comments {
    postId: string;
    commentId: string;
    userId: string;
    userName: string;
    userPhotoUrl: string;
    comment: string;
    createdAt: Timestamp;
}

export const useGetComment = ({id}: Props) =>{
    const [comments, setComments] = useState<Comments[]>([]); 
        
    // Firestore reference and query for comments
    const postRef = doc(db, 'posts', id);
    const commentRef = collection(postRef, 'comments');
    const commentDoc = query(
    commentRef,
    where('postId', '==', id),
    orderBy('createdAt', 'desc') // Order comments by 'createdAt' in descending order
);

    
    // Fetch comments from Firestore
    const getComment = useCallback(async () => {
        try {
            const data = await getDocs(commentDoc);
            setComments(
                data.docs.map(doc => ({
                    ...doc.data(),
                    commentId: doc.id,
                })) as Comments[]
            );
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    }, [commentDoc]);

    // Fetch comments when component mounts or when the post changes
    useEffect(() => {
        getComment();
    }, []);
   

    return{comments, getComment};

}