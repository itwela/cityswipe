import React from 'react';
import Match from './page';
import prisma from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

async function fetchData() {
  const clerkuser = await currentUser();

  if (!clerkuser) {
      redirect("/sign-in");
  }

  // find user in database by Clerk ID or email
  let user = await prisma.user.findFirst({
      where: {
          OR: [
              { id: clerkuser.id },
              { email: clerkuser.emailAddresses[0]?.emailAddress || "" }
          ]
      },
  });

  // create user in database if not exists or update missing fields
  if (!user) {
      user = await prisma.user.create({
          data: {
              id: clerkuser.id,
              name: clerkuser.fullName || "",
              email: clerkuser.emailAddresses[0]?.emailAddress || "",
              username: clerkuser.username || "",
          },
      });
  } else {
      const updateData: { name?: string; email?: string; username?: string } = {};
      if (!user.name) updateData.name = clerkuser.fullName || "";
      if (!user.email) updateData.email = clerkuser.emailAddresses[0]?.emailAddress || "";
      if (!user.username) updateData.username = clerkuser.username || "";

      if (Object.keys(updateData).length > 0) {
          user = await prisma.user.update({
              where: { id: user.id },
              data: updateData,
          });
      }
  }

  return user;
}

// this makes sure the user has answered at least one question from the quiz
async function fetchQuestions() {
    const clerkuser = await currentUser();

    if (!clerkuser) {
        redirect("/sign-in");
    }

    let questions = await prisma?.quizAnswer.findMany({
        where: {
            userId: clerkuser?.id
        }
    })

    if (questions.length < 1) {
        redirect("/quiz");
    }

    return questions
}

export default async function MatchServer() {
  
  const data = await fetchData();
  const questions = await fetchQuestions();

  return (
    
    <div className="match-layout">
      <Match/>
    </div>
  );
};
