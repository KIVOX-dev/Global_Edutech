'use client'

import { Course } from '@/data/courses'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { blendStyle } from '@/lib/image-blend'
import { Monitor } from 'lucide-react'

interface CourseCardProps {
  course: Course
}

export default function CourseCard({ course }: CourseCardProps) {
  const { title, intro, slug, details, category } = course
  const { duration, ageGroup } = details
  
  // Convert category ID to display name
  const categoryLabels = {
    academic: 'Academic Program',
    skill: 'Skill Development',
    teacher: 'Teacher Training'
  }

  return (
    <motion.div 
      whileHover={{ y: -5 }} 
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Card className="rounded-2xl bg-card ring-1 ring-border shadow-gentle overflow-hidden h-full flex flex-col">
        <div className="relative h-48 w-full overflow-hidden">
          <img 
            src={course.imageUrl} 
            alt={title}
            className="w-full h-full object-contain bg-white p-2"
            style={blendStyle(course.imageUrl)}
          />
          <Badge style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 14px 50%)' }} className={`absolute right-0 top-4 rounded-none border-0 py-1.5 pl-6 pr-4 font-bold drop-shadow-md ${category === 'skill' ? 'bg-[#FF7A29] text-white hover:bg-[#FF7A29]' : category === 'teacher' ? 'bg-[#FFD93D] text-[#3b1d7a] hover:bg-[#FFD93D]' : 'bg-purple text-white hover:bg-purple'}`}>
            {categoryLabels[category as keyof typeof categoryLabels]}
          </Badge>
        </div>
        
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-xl text-primary">{title}</CardTitle>
          <CardDescription className="text-foreground/80 line-clamp-2">{intro}</CardDescription>
        </CardHeader>
        
        <CardContent className="pb-2 flex-grow">
          <div className="flex flex-wrap items-center gap-2 mb-2 text-sm">
            {duration && (
              <Badge variant="outline" className="flex items-center gap-1 border-pastel-blue">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                {duration}
              </Badge>
            )}
            
            <Badge className="flex items-center gap-1 border-0 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
              <Monitor className="h-4 w-4" /> Online &amp; Offline
            </Badge>

            {ageGroup && (
              <Badge variant="outline" className="flex items-center gap-1 border-pastel-green">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
                Ages {ageGroup}
              </Badge>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="mt-auto">
          <div className="grid grid-cols-2 gap-2 w-full">
            <Button variant="outline" asChild>
              <Link href={`/courses/${slug}`}>
                Learn More
              </Link>
            </Button>
            <Button variant="heroEnrollNow" asChild>
              <Link href={`/enquiry?course=${encodeURIComponent(title)}`}>
                Enroll Now
              </Link>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
