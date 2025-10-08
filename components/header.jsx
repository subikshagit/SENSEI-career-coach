
import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, FileText, GraduationCapIcon, LayoutDashboard, PenBox, StarsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  

  return (
    <header className="fixed top-0 w-full border-b bg-background/80 backdrop-blur-md z-50 supports-[backdrop-filter]:bg-background/60">

      <nav className="container mx-auto h-16 flex items-center justify-between px-4">
        <Link href="/">
          <Image
            src="/logo.png"
            alt="Logo"
            width={120}
            height={60}
            className="h-12 py-1 w-auto object-contain" />
        </Link>


        <div className="flex items-center space-x-2 md:space-x-4">
          <SignedIn>
            <Link href={"/dashboard"}>
              <Button variant="outline">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span className="hidden md:block">Industry Insights</span>
              </Button>
            </Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <StarsIcon className="mr-2 h-4 w-4" />
                <span className="hidden md:block">Growth Tools</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem asChild>
                <Link href={"/resume"} className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="ml-2">Resume Builder</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={"/ai-cover-letter"} className="flex items-center gap-2">
                  <PenBox className="h-4 w-4" />
                  <span className="ml-2">Cover Letter</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={"/interview"} className="flex items-center gap-2">
                  <GraduationCapIcon className="h-4 w-4" />
                  <span className="ml-2">Interview Prep</span>
                </Link>
              </DropdownMenuItem>

            </DropdownMenuContent>
          </DropdownMenu>
     </SignedIn>
      <SignedOut>
        <SignInButton>
          <Button variant="outline">Sign In</Button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <UserButton 
        appearance={
          {
            elements: {
              avatarBox: "w-10 h-10",
              userButtonPopoverCard: "shadow-xl",
              userPreviewMainIdentifier: "font-semibold",
            },
          }
        }
        afterSignOutUrl="/"/>
      </SignedIn>
      </div>
      </nav>
    </header >
    
  );
};
