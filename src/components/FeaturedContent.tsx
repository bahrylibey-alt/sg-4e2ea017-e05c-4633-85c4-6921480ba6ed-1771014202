import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, ArrowUpRight } from "lucide-react";

const featuredArticles = [
  {
    id: 1,
    title: "The Ancient Coffee Ceremony",
    description: "Discover the sacred Ethiopian coffee ceremony, a ritual that brings communities together for centuries.",
    category: "Traditions",
    author: "Abebe Kebede",
    date: "Feb 10, 2026",
    image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&auto=format&fit=crop",
    readTime: "5 min read"
  },
  {
    id: 2,
    title: "Ethiopian Orthodox Christianity",
    description: "Explore the deep spiritual traditions and unique practices of one of the oldest Christian denominations.",
    category: "Religion",
    author: "Rahel Tesfaye",
    date: "Feb 9, 2026",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&auto=format&fit=crop",
    readTime: "7 min read"
  },
  {
    id: 3,
    title: "Traditional Ethiopian Cuisine",
    description: "From injera to doro wat, experience the rich flavors and stories behind Ethiopia's beloved dishes.",
    category: "Food",
    author: "Mulugeta Alemu",
    date: "Feb 8, 2026",
    image: "https://images.unsplash.com/photo-1604567290864-512f0dba4c3e?w=800&auto=format&fit=crop",
    readTime: "6 min read"
  },
  {
    id: 4,
    title: "The Legend of Queen Sheba",
    description: "Uncover the fascinating tale of the Queen of Sheba and her journey to King Solomon.",
    category: "History",
    author: "Selam Desta",
    date: "Feb 7, 2026",
    image: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop",
    readTime: "8 min read"
  },
  {
    id: 5,
    title: "Ethiopian Music & Dance",
    description: "Experience the vibrant rhythms and movements that define Ethiopian cultural expression.",
    category: "Arts",
    author: "Dawit Bekele",
    date: "Feb 6, 2026",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&auto=format&fit=crop",
    readTime: "5 min read"
  },
  {
    id: 6,
    title: "Ancient Rock Churches of Lalibela",
    description: "Marvel at the architectural wonders carved from solid rock centuries ago.",
    category: "Architecture",
    author: "Hanna Girma",
    date: "Feb 5, 2026",
    image: "https://images.unsplash.com/photo-1555840280-c372ae5d57e6?w=800&auto=format&fit=crop",
    readTime: "9 min read"
  }
];

export function FeaturedContent() {
  return (
    <section className="py-20 px-6 bg-background">
      <div className="container">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <Badge variant="outline" className="text-primary border-primary/30">
            Featured Stories
          </Badge>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">
            Explore Our <span className="text-primary">Latest</span> Articles
          </h2>
          <p className="text-lg text-muted-foreground">
            Dive into captivating stories about Ethiopian culture, history, and traditions
          </p>
        </div>

        {/* Articles grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredArticles.map((article, index) => (
            <Card 
              key={article.id} 
              className="group overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-border/50 hover:border-primary/30"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Image */}
              <div className="relative h-56 overflow-hidden bg-muted">
                <img 
                  src={article.image} 
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
                  {article.category}
                </Badge>
              </div>

              <CardHeader className="space-y-3">
                <CardTitle className="text-xl group-hover:text-primary transition-colors line-clamp-2">
                  {article.title}
                  <ArrowUpRight className="inline-block ml-2 w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {article.description}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>{article.author}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{article.date}</span>
                    </div>
                  </div>
                  <span className="text-primary font-medium">{article.readTime}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}