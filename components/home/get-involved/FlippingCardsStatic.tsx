"use client";
import React from "react";
import { FlippingCardStatic } from "./FlippingCardStatic";
import monitorUp from "../../../public/svgs/monitor-up.svg";
import vote from "../../../public/svgs/vote.svg";
import heart from "../../../public/svgs/heart-handshake.svg";
import clipboard from "../../../public/svgs/clipboard-edit.svg";
// import littleHeart from "../../../public/home/get-involved/heart.svg";
import Image from "next/image";
import { ButtonStyledLink } from "../../common/ui/ButtonStyledLink";
import { Pm } from "../../common/texts/Pm";
import highlightSwimmer from "../../../public/home/Highlight_Swimmer.svg";

export const FlippingCardsStatic = () => {


  return (
    <div className="relative z-10 md:grid grid-cols-2 grid-rows-1 gap-4 card-grid m-auto max-w-[400px] md:max-w-[720px] lg:max-w-[800px]" >
      <div className="absolute -top-16 -left-32 md:-top-20 md:-left-32 lg:-top-28 lg:-left-40 hidden xsm:block">
        <Image src={highlightSwimmer} alt="" className=" pointer-events-none select-none" />
      </div>

      <FlippingCardStatic
        heading1="Register"
        heading2="Creators and Voters"
        description={
          <div className="w-full">
            <Pm className=" mt-4 md:mt-12 mb-4 font-light text-base">

            Everyone is invited!
            </Pm>
            <Pm className="font-light text-base mb-4 md:mb-0">
              It's easy to register to upload your art or to judge your favorite artwork.
            </Pm>
          </div>
        }
        icon={clipboard}
        color="#0286C3"
      >
        <div className="flex-grow min-h-[20px]"></div> {/* Spacer element */}
        <ButtonStyledLink
          href={"/register"}
          className="my-1 w-full"
          onTouchStart={(e: React.TouchEvent<HTMLAnchorElement>) => { e.stopPropagation(); }}
          onClick={(e: React.MouseEvent<HTMLAnchorElement>) => { e.stopPropagation(); }}
        >
          Register here
        </ButtonStyledLink>
      </FlippingCardStatic>
      <FlippingCardStatic
        heading1="Create & Share"
        heading2="Youths aged 8 to 20: Share your art with the world!"
        description={
          <div>
            <Pm className="mt-4 md:mt-12 mb-4 font-light text-sm md:text-base">
            Unleash your creativity by painting or drawing your favorite sport. Digital or AI art is also accepted.
            </Pm>
            {/* <Pm className="font-light text-sm md:text-base mb-2 md:mb-4">
              Register, Upload, and Share to get votes.
            </Pm> */}
          </div>
        }
        icon={monitorUp}
        color="#EE2F4D"
      >
        <div className="flex-grow min-h-[20px]"></div> {/* Spacer element */}
      </FlippingCardStatic>
      <FlippingCardStatic
        heading1="Art Lovers & Sports Fans"
        description={
          <div>
            <Pm className="font-light text-sm md:text-base">
            Register for free, then search for artists by name or country to cast your vote. You can vote only once.
            </Pm>
            {/* <Pm className="font-light text-base mb-4 md:mb-0">
              You must register to upload your artwork or to vote for your favorite artist or artwork.
            </Pm> */}
          </div>
        }
        icon={vote}
        color="#FBB22E"
      >
        <div className="flex-grow min-h-[20px]"></div> {/* Spacer element */}
        {/* <ButtonStyledLink
          href={"https://icaf.org/about/contact-us"}
          className="my-1 w-full"
          onTouchStart={(e: React.TouchEvent<HTMLAnchorElement>) => { e.stopPropagation(); }}
          onClick={(e: React.MouseEvent<HTMLAnchorElement>) => { e.stopPropagation(); }}
        >
          Partner with ICAF
        </ButtonStyledLink> */}
      </FlippingCardStatic>
      <FlippingCardStatic
        heading1="Partner"
        heading2="You can help art and sports change the world."
        description={
          <div className="flex flex-col justify-between">
            {/* <Pm className="mt-6 font-light text-sm md:text-base">
            </Pm> */}

            <Pm className=" font-light text-sm md:text-base">
              {"Please "}
              {/* <a href="https://myfavoritesport.org/sponsor/" target="_blank" rel="noopener noreferrer" className="underline ">
                here
              </a>
              {" for sponsorship."}
            </Pm>
            <Pm className="mb-6 font-light text-sm md:text-base">
              {" "}  */}
              <a href="https://icaf.org/about/contact-us" target="_blank" rel="noopener noreferrer" className="underline ">
                contact us
              </a>
              {" about sponsorship."}
            </Pm>
            {/* <Pm className="font-light text-base mb-4 md:mb-0">
              You must register to upload your artwork or to vote for your favorite artist or artwork.
            </Pm> */}
          </div>
        }
        icon={heart}
        color="#168C39"
      >
        <div className="flex-grow min-h-[20px]"></div> {/* Spacer element */}
        {/* <ButtonStyledLink
          href={"https://icaf.org/about/contact-us"}
          className="my-1 w-full"
          onTouchStart={(e: React.TouchEvent<HTMLAnchorElement>) => { e.stopPropagation(); }}
          onClick={(e: React.MouseEvent<HTMLAnchorElement>) => { e.stopPropagation(); }}
        >
          Sponsor
        </ButtonStyledLink> */}
      </FlippingCardStatic>
    </div>
  );
};