"use client";
/** GSAP registered once. Everything that animates with GSAP imports it from here. */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export { gsap, ScrollTrigger, useGSAP };
