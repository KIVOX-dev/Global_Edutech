"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

// Example course data - replace with your actual data structure
const courseOptions = [
  { id: "abacus", name: "Abacus" },
  { id: "vedic-maths", name: "Vedic Maths" },
  { id: "phonics", name: "Phonics" },
  { id: "art", name: "Art & Craft" },
  { id: "chess", name: "Chess" }
];

interface FormValues {
  parentName: string;
  childName: string;
  childAge: string;
  email: string;
  phone: string;
  comments: string;
}

export function EnrollForm() {
  const [selectedCourse, setSelectedCourse] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormValues>();
  const { toast } = useToast();
  
  const onSubmit = async (data: FormValues) => {
    // Simulate form submission
    try {
      console.log({ ...data, course: selectedCourse });
      
      // Add your actual form submission logic here
      // await fetch('/api/submit-form', { method: 'POST', body: JSON.stringify({...data, course: selectedCourse}) });
      
      toast({
        title: "Form Submitted!",
        description: "We'll get back to you shortly.",
        variant: "default",
      });
      
      reset();
      setSelectedCourse("");
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <form 
        onSubmit={handleSubmit(onSubmit)} 
        className="grid gap-4 rounded-2xl bg-card p-6 shadow-gentle ring-1 ring-purpleLight/60"
      >
        <h3 className="font-display text-2xl text-primary mb-4">Enroll Your Child</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Parent Name</label>
            <Input 
              {...register("parentName", { required: "Parent name is required" })} 
              className="form-input"
              placeholder="Your full name"
            />
            {errors.parentName && (
              <p className="text-sm text-red-500 mt-1">{errors.parentName.message}</p>
            )}
          </div>
          
          <div>
            <label className="form-label">Child Name</label>
            <Input 
              {...register("childName", { required: "Child name is required" })} 
              className="form-input"
              placeholder="Child's full name"
            />
            {errors.childName && (
              <p className="text-sm text-red-500 mt-1">{errors.childName.message}</p>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Child Age</label>
            <Input 
              type="number" 
              {...register("childAge", { 
                required: "Child age is required", 
                min: { value: 3, message: "Minimum age is 3" },
                max: { value: 16, message: "Maximum age is 16" }
              })} 
              className="form-input"
              placeholder="e.g., 5"
            />
            {errors.childAge && (
              <p className="text-sm text-red-500 mt-1">{errors.childAge.message}</p>
            )}
          </div>
          <div>
            <label className="form-label">Course</label>
            <Select onValueChange={setSelectedCourse} value={selectedCourse}>
              <SelectTrigger className="form-input">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {courseOptions.map(course => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Email</label>
            <Input 
              type="email" 
              {...register("email", { 
                required: "Email is required",
                pattern: { 
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, 
                  message: "Invalid email address" 
                } 
              })} 
              className="form-input"
              placeholder="your@email.com"
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>
          
          <div>
            <label className="form-label">Phone</label>
            <Input 
              type="tel" 
              {...register("phone", { 
                required: "Phone number is required",
                pattern: { 
                  value: /^[0-9\+\-\(\)]{10,15}$/, 
                  message: "Invalid phone number" 
                } 
              })} 
              className="form-input"
              placeholder="Your contact number"
            />
            {errors.phone && (
              <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
            )}
          </div>
        </div>
        
        <div>
          <label className="form-label">Comments (optional)</label>
          <Textarea 
            {...register("comments")} 
            className="form-input" 
            placeholder="Any specific requirements or questions..."
            rows={4}
          />
        </div>
        
        <Button 
          variant="primary" 
          size="lg"
          className="mt-2" 
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Enrollment'}
        </Button>
      </form>
    </motion.div>
  );
}
