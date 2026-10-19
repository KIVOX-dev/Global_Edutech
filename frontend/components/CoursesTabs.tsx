'use client'

import { useState } from 'react'
import { getCategories, getCoursesByCategory } from '@/lib/courses-data'
import CourseCard from './CourseCard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"

export default function CoursesTabs() {
  const categories = getCategories()
  const [activeTab, setActiveTab] = useState(categories[0].id)
  
  return (
    <section id="services" className="section-padding bg-white">
      <div className="container-custom">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-primary mb-6">
          Our Educational Programs
        </h2>
        </div>
        <p className="text-lg md:text-xl text-foreground/80 max-w-3xl mx-auto leading-relaxed">
          Choose from our range of carefully designed programs that cater to different 
          learning needs and age groups, all delivered with excellence and care.
        </p>
      </motion.div>

      <Tabs 
        defaultValue={categories[0].id} 
        className="w-full"
        onValueChange={(value) => setActiveTab(value)}
      >
        <TabsList className="bg-card/70 ring-1 ring-border mb-6 flex flex-wrap justify-center">
          {categories.map((category) => (
            <TabsTrigger key={category.id} value={category.id}>
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {categories.map((category) => (
          <TabsContent key={category.id} value={category.id} className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {getCoursesByCategory(category.id as 'academic' | 'skill' | 'teacher').map((course) => (
                <CourseCard key={course.slug} course={course} />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
      
      <div className="text-center mt-12">
        <a href="/courses" className="inline-flex items-center font-semibold text-primary hover:text-primary/80 border-2 border-black px-4 py-2 rounded-lg transition-all hover:bg-black hover:text-white">
          View All Programs
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </a>
      </div>
    </div>
    </section>
  )
}
