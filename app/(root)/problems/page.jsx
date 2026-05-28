import { db } from '@/lib/db';
import { getAllProblems } from '@/modules/problems/actions';
import ProblemsTable from '@/modules/problems/components/problem-table';
import { currentUser } from '@clerk/nextjs/server'
import React from 'react'

export const dynamic = 'force-dynamic';

const ProblemsPage = async() => {
    const user = await currentUser()

    let dbUser = null;

    if(user){
         dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
      select: { id: true, role: true }
    });
    }

    const result = await getAllProblems();

    if (!result.success) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-destructive">Error loading problems: {result.error}</p>
        </div>
      );
    }

  return (
    <div className='container mx-auto py-32'>
        <ProblemsTable problems={result.data ?? []} user={dbUser}/>
    </div>
  )
}

export default ProblemsPage