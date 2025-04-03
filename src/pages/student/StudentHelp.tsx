
import StudentLayout from "@/components/layouts/StudentLayout";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { 
  BookOpen, 
  HelpCircle, 
  MessageSquare, 
  Phone, 
  Search,
  FileText,
  DoorOpen,
  Calendar,
  AlertTriangle,
  User
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const StudentHelp = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const faqs = [
    {
      category: "general",
      question: "What are the hostel timings?",
      answer: "The hostel gates close at 10:00 PM every night. Students must return to the hostel before this time. The gates open at 5:00 AM in the morning."
    },
    {
      category: "general",
      question: "How do I report maintenance issues?",
      answer: "You can report maintenance issues through the 'Complaints' section in your student dashboard. Select the appropriate category, describe the issue, and submit the form."
    },
    {
      category: "general",
      question: "What facilities are available in the hostel?",
      answer: "Our hostel offers various facilities including Wi-Fi, laundry service, common room with TV, study rooms, gym, dining hall, and 24/7 security."
    },
    {
      category: "rooms",
      question: "How do I book a room?",
      answer: "You can book a room through the 'Book Room' section in your student dashboard. Follow the instructions to select your preferred room type and complete the booking process."
    },
    {
      category: "rooms",
      question: "Can I change my room once allocated?",
      answer: "Room changes are permitted under special circumstances. You need to submit a room change request through the dashboard and provide a valid reason. The administration will review your request."
    },
    {
      category: "rooms",
      question: "What items are provided in the hostel rooms?",
      answer: "Each room comes with a bed, mattress, study table, chair, cupboard, and bookshelf. Students need to bring their own bedsheets, pillows, blankets, and other personal items."
    },
    {
      category: "fees",
      question: "How do I pay my hostel fees?",
      answer: "Hostel fees can be paid through the 'Fees' section in your dashboard. You can use credit/debit cards, net banking, or UPI for online payments."
    },
    {
      category: "fees",
      question: "What is the fee structure for different room types?",
      answer: "The fee structure varies based on room type: Single rooms: ₹80,000 per semester, Double sharing: ₹60,000 per semester, Triple sharing: ₹45,000 per semester."
    },
    {
      category: "fees",
      question: "Is there a late fee for delayed payments?",
      answer: "Yes, there is a late fee of ₹100 per day for payments made after the due date. The due date for each semester is communicated well in advance."
    }
  ];

  const filteredFaqs = searchQuery 
    ? faqs.filter(faq => 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqs;

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Help & Support</h1>
          <p className="text-muted-foreground">Find answers to common questions and get support</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            className="pl-10"
            placeholder="Search for help topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Tabs defaultValue="faq">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="faq">FAQs</TabsTrigger>
            <TabsTrigger value="guidelines">Guidelines</TabsTrigger>
            <TabsTrigger value="contact">Contact Us</TabsTrigger>
          </TabsList>
          
          <TabsContent value="faq" className="space-y-4">
            {searchQuery && filteredFaqs.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <HelpCircle className="h-10 w-10 text-gray-400 mb-4" />
                  <p className="text-lg text-gray-500">No FAQs found for your search</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <DoorOpen className="mr-2 h-5 w-5" />
                      <span>Room & Accommodation</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {filteredFaqs
                        .filter(faq => faq.category === "rooms")
                        .map((faq, index) => (
                          <AccordionItem key={index} value={`room-${index}`}>
                            <AccordionTrigger>{faq.question}</AccordionTrigger>
                            <AccordionContent>{faq.answer}</AccordionContent>
                          </AccordionItem>
                        ))}
                    </Accordion>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="mr-2 h-5 w-5" />
                      <span>Fees & Payments</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {filteredFaqs
                        .filter(faq => faq.category === "fees")
                        .map((faq, index) => (
                          <AccordionItem key={index} value={`fee-${index}`}>
                            <AccordionTrigger>{faq.question}</AccordionTrigger>
                            <AccordionContent>{faq.answer}</AccordionContent>
                          </AccordionItem>
                        ))}
                    </Accordion>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BookOpen className="mr-2 h-5 w-5" />
                      <span>General Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {filteredFaqs
                        .filter(faq => faq.category === "general")
                        .map((faq, index) => (
                          <AccordionItem key={index} value={`general-${index}`}>
                            <AccordionTrigger>{faq.question}</AccordionTrigger>
                            <AccordionContent>{faq.answer}</AccordionContent>
                          </AccordionItem>
                        ))}
                    </Accordion>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="guidelines" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  <span>Hostel Rules & Regulations</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">General Rules</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Hostel gates close at 10:00 PM. Late entries require prior permission.</li>
                    <li>Guests are allowed only in the visitor's area during visiting hours (9:00 AM to 6:00 PM).</li>
                    <li>Consumption of alcohol, smoking, and illegal substances is strictly prohibited.</li>
                    <li>Students are responsible for maintaining cleanliness in their rooms and common areas.</li>
                    <li>Noise levels should be kept low, especially during study hours (8:00 PM to 10:00 PM).</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Room Guidelines</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Do not paste posters or drive nails into the walls.</li>
                    <li>Electric appliances like heaters, irons, and kettles are not allowed in rooms.</li>
                    <li>Report any damage to furniture or fixtures immediately.</li>
                    <li>Room inspections will be conducted periodically.</li>
                    <li>Keep valuables secure. The hostel administration is not responsible for any loss.</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Disciplinary Actions</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Violation of hostel rules may result in warnings, fines, or expulsion.</li>
                    <li>Repeated late entries without permission will lead to disciplinary action.</li>
                    <li>Damaging hostel property will result in fines and possible further action.</li>
                    <li>Misconduct towards staff or fellow students will not be tolerated.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  <span>Important Dates</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-md p-3">
                      <h3 className="font-semibold mb-1">Fee Payment Deadlines</h3>
                      <p>First Semester: August 15, 2025</p>
                      <p>Second Semester: January 15, 2026</p>
                    </div>
                    
                    <div className="border rounded-md p-3">
                      <h3 className="font-semibold mb-1">Room Allocation</h3>
                      <p>New Students: July 25, 2025</p>
                      <p>Returning Students: July 20, 2025</p>
                    </div>
                    
                    <div className="border rounded-md p-3">
                      <h3 className="font-semibold mb-1">Hostel Vacations</h3>
                      <p>Winter: December 15, 2025 - January 5, 2026</p>
                      <p>Summer: May 20, 2026 - July 10, 2026</p>
                    </div>
                    
                    <div className="border rounded-md p-3">
                      <h3 className="font-semibold mb-1">Annual Events</h3>
                      <p>Cultural Fest: October 10-12, 2025</p>
                      <p>Sports Meet: February 15-17, 2026</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="contact" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  <span>Contact Information</span>
                </CardTitle>
                <CardDescription>
                  Reach out to the hostel administration for any queries or assistance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-md p-4 flex items-start space-x-3">
                      <Phone className="h-5 w-5 text-blue-500 mt-1" />
                      <div>
                        <h3 className="font-semibold">Main Office</h3>
                        <p>+91 98765 43210</p>
                        <p className="text-sm text-gray-500">Available 9 AM - 5 PM (Mon-Sat)</p>
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-4 flex items-start space-x-3">
                      <Phone className="h-5 w-5 text-red-500 mt-1" />
                      <div>
                        <h3 className="font-semibold">Emergency Contact</h3>
                        <p>+91 98765 12345</p>
                        <p className="text-sm text-gray-500">Available 24/7</p>
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-4 flex items-start space-x-3">
                      <MessageSquare className="h-5 w-5 text-green-500 mt-1" />
                      <div>
                        <h3 className="font-semibold">Email Support</h3>
                        <p>hostel.support@aihostelconnect.com</p>
                        <p className="text-sm text-gray-500">Response within 24 hours</p>
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-4 flex items-start space-x-3">
                      <User className="h-5 w-5 text-purple-500 mt-1" />
                      <div>
                        <h3 className="font-semibold">Warden</h3>
                        <p>Dr. Rajesh Kumar</p>
                        <p className="text-sm text-gray-500">+91 97654 32109</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <h3 className="font-semibold mb-2">Submit a Query</h3>
                    <div className="space-y-3">
                      <Input placeholder="Your subject" />
                      <textarea 
                        className="w-full rounded-md border border-gray-300 p-2 min-h-[100px]"
                        placeholder="Describe your query in detail..."
                      />
                      <Button>Submit Query</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </StudentLayout>
  );
};

export default StudentHelp;
