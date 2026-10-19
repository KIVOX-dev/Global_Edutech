'use client'

export default function WhyChooseUs() {
  const features = [
    {
      icon: "🎯",
      title: "Personalized Learning Paths",
      description: "Each child receives a customized curriculum based on their unique learning style, pace, and interests."
    },
    {
      icon: "👨‍🏫",
      title: "Experienced Educators",
      description: "Our certified teachers bring years of experience in early childhood education and specialized subject expertise."
    },
    {
      icon: "🏠",
      title: "Convenient Home Services",
      description: "Professional tutoring brought directly to your doorstep, saving time while ensuring quality education."
    },
    {
      icon: "🎨",
      title: "Holistic Development",
      description: "We focus on academic excellence alongside creativity, social skills, and emotional intelligence."
    },
    {
      icon: "🌟",
      title: "Proven Success Rate",
      description: "98% of our students show measurable improvement within 3 months of enrollment."
    },
    {
      icon: "🔒",
      title: "Safe & Secure Environment",
      description: "Child safety and data privacy are our top priorities, with secure facilities and transparent communication."
    }
  ];

  return (
  <section id="why-choose-us" className="section-padding bg-white">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-primary mb-6">
            Why Parents Trust Global Edutech
          </h2>
          <p className="text-lg md:text-xl text-foreground/80 max-w-3xl mx-auto leading-relaxed">
            We combine traditional teaching excellence with modern educational innovations 
            to give your child the best possible start in their learning journey.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-muted rounded-2xl p-8 transform hover:-translate-y-2 transition-all duration-300"
            >
              <div className="text-5xl mb-6 text-center">{feature.icon}</div>
              <h3 className="text-xl font-bold text-primary mb-4 text-center">
                {feature.title}
              </h3>
              <p className="text-foreground/70 text-center leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 bg-purpleLight rounded-3xl p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="border-r border-purple/20 last:border-r-0 md:border-r">
              <div className="text-3xl font-bold text-primary mb-2">10,000+</div>
              <div className="text-foreground/80">Happy Families</div>
            </div>
            <div className="border-r border-purple/20 last:border-r-0 md:border-r">
              <div className="text-3xl font-bold text-primary mb-2">19 Years</div>
              <div className="text-foreground/80">Experience</div>
            </div>
            <div className="border-r border-purple/20 last:border-r-0 md:border-r">
              <div className="text-3xl font-bold text-primary mb-2">50+</div>
              <div className="text-foreground/80">Expert Teachers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">98%</div>
              <div className="text-foreground/80">Success Rate</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
