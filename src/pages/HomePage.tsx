import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md"
    >
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            Single Sign-<span className="gradient-text">On</span>
          </CardTitle>
          <CardDescription>
            One account for every app on karanparmar.in
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button asChild variant="default" className="w-full">
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild className="w-full">
            <Link to="/signup">Create account</Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}
