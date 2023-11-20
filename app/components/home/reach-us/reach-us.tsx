"use client";

import Image from "next/image";

import { Button } from "@components/button";
import { TRANSLATION } from "./reach-us.constants";

export const ReachUs = () => {

  const onContactUsClick = () => {
    /* TODO: Implement Contact Link */
  };

  return (
    <div className="container mx-auto bg-[#e5e5e5] w-full min-h-[300px] relative flex flex-col items-start justify-center pl-16 mb-12 sm:pl-8">
      <h1 className="text-black text-center text-3xl font-bold mb-4 sm:text-2xl">{TRANSLATION.title}</h1>
      <p className="text-black text-left text-lg font-normal mb-5 max-w-sm sm:text-base">{TRANSLATION.description}</p>
      <Button
        text="Contact Us"
        type="primary"
        size="medium"
        onClickHandler={onContactUsClick}
      />
      <div className="absolute right-8 top-[-90px] w-48 h-48 sm:w-28 sm:h-28 sm:top-[-50px] sm:right-5">
        <Image alt="reach-us" src="/img/polygon.png" fill={true} />
      </div>
    </div>
  );
};
