"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Download,
  Edit,
  FileText,
  Loader2,
  Mail,
  Send,
  XCircle,
} from "lucide-react"

import { cn, formatCurrency } from "@/lib/utils"
import { showSuccess, showError } from "@/components/ui/toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PageHeader } from "@/components/ui/page-header"

interface InvoiceDetail {
  id: string
  invoiceNumber: string
  title: string
  description?: string
  totalAmount: number
  taxAmount: number
  discountAmount: number
  grandTotal: number
  dueDate?: string
  paidDate?: string
  status: string
  notes?: string
  createdAt: string
  project?: { id: string; name: string; code: string }
  items: Array<{
    id: string
    description: string
    unit: string
    quantity: number
    unitRate: number
    amount: number
  }>
}

const statusVariant: Record<string, "success" | "warning" | "info" | "destructive" | "secondary"> = {
  PAID: "success",
  PENDING: "warning",
  PARTIAL: "info",
  OVERDUE: "destructive",
  CANCELLED: "destructive",
}

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const fetchInvoice = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/invoices/${id}`)
      const data = await res.json()
      if (data.success) {
        setInvoice(data.data)
      } else {
        showError("Invoice not found")
        router.push("/invoices")
      }
    } catch {
      showError("Failed to load invoice")
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => { fetchInvoice() }, [fetchInvoice])

  const handleStatusUpdate = async (status: string) => {
    try {
      setUpdating(true)
      const body: any = { status }
      if (status === "PAID") body.paidDate = new Date().toISOString()
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) {
        showSuccess(`Invoice marked as ${status}`)
        fetchInvoice()
      } else {
        showError(data.error || "Failed to update invoice")
      }
    } catch {
      showError("Failed to update invoice")
    } finally {
      setUpdating(false)
    }
  }

  const handleDownloadPDF = () => {
    if (!invoice) return
    showSuccess("PDF download started")
    const content = `Invoice: ${invoice.invoiceNumber}\nTitle: ${invoice.title}\nProject: ${invoice.project?.name || ""}\nDate: ${invoice.createdAt}\nDue: ${invoice.dueDate || "N/A"}\n\nItems:\n${invoice.items.map((i, idx) => `${idx + 1}. ${i.description} | ${i.unit} | ${i.quantity} | ₹${i.unitRate} | ₹${i.amount}`).join("\n")}\n\nSubtotal: ₹${invoice.totalAmount}\nDiscount: ₹${invoice.discountAmount}\nGST: ₹${invoice.taxAmount}\nGrand Total: ₹${invoice.grandTotal}\n\nTerms:\n${invoice.notes || ""}`
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${invoice.invoiceNumber}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!invoice) return null

  const subtotal = invoice.items.reduce((s, i) => s + i.amount, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title={invoice.invoiceNumber}
        description={invoice.title}
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Invoices", href: "/invoices" },
          { label: invoice.invoiceNumber },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/invoices">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            <Button variant="outline">
              <Send className="mr-2 h-4 w-4" />
              Send
            </Button>
            {invoice.status === "PENDING" && (
              <>
                <Button
                  variant="default"
                  onClick={() => handleStatusUpdate("PAID")}
                  disabled={updating}
                >
                  {updating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Mark as Paid
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleStatusUpdate("OVERDUE")}
                  disabled={updating}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Mark Overdue
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="border rounded-lg p-6 space-y-6 bg-background">
                <div className="flex items-start justify-between border-b pb-4">
                  <div>
                    <h2 className="text-xl font-bold">BuildRight Construction Pvt Ltd</h2>
                    <p className="text-sm text-muted-foreground mt-1">Accounts & Billing Division</p>
                    <p className="text-sm text-muted-foreground">402, Marathon Futurex, Mafatlal Mills Compounds</p>
                    <p className="text-sm text-muted-foreground">N.M. Joshi Marg, Lower Parel, Mumbai - 400013</p>
                    <p className="text-sm text-muted-foreground mt-1">CIN: U45200MH2015PTC123456</p>
                    <p className="text-sm text-muted-foreground">GSTIN: 27AABCB1234C1Z5</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-base px-4 py-1.5">INVOICE</Badge>
                    <p className="text-sm font-mono font-bold mt-2">{invoice.invoiceNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      Date: {new Date(invoice.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                    {invoice.dueDate && (
                      <p className="text-sm text-muted-foreground">
                        Due: {new Date(invoice.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-muted-foreground mb-1">Project,</p>
                    <p className="font-semibold">{invoice.project?.name || "—"}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground mb-1">Invoice For,</p>
                    <p className="font-semibold">{invoice.title}</p>
                  </div>
                </div>

                {invoice.description && (
                  <div className="text-sm">
                    <p className="font-medium text-muted-foreground mb-1">Description</p>
                    <p>{invoice.description}</p>
                  </div>
                )}

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Rate (₹)</TableHead>
                      <TableHead className="text-right">Amount (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.items.map((item, idx) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-xs">{idx + 1}</TableCell>
                        <TableCell className="font-medium">{item.description}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell className="text-right">{item.quantity.toLocaleString("en-IN")}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.unitRate)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(item.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="space-y-2 border-t pt-4">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  {invoice.discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-emerald-600">
                      <span>Discount</span>
                      <span>-{formatCurrency(invoice.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>GST @ 18%</span>
                    <span className="font-medium">{formatCurrency(invoice.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t-2 border-primary pt-3">
                    <span>Grand Total</span>
                    <span>{formatCurrency(invoice.grandTotal)}</span>
                  </div>
                </div>

                {invoice.notes && (
                  <div className="text-xs space-y-1 border-t pt-4">
                    <p className="font-semibold mb-2">Terms & Conditions:</p>
                    <pre className="whitespace-pre-wrap font-sans">{invoice.notes}</pre>
                  </div>
                )}

                <div className="flex justify-between items-end border-t pt-4 mt-4">
                  <div>
                    <p className="text-xs text-muted-foreground">For BuildRight Construction Pvt Ltd</p>
                    <div className="mt-8 border-b border-foreground w-48" />
                    <p className="text-xs font-medium mt-1">Authorised Signatory</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Received by Client</p>
                    <div className="mt-8 border-b border-foreground w-48 ml-auto" />
                    <p className="text-xs font-medium mt-1">Client Signature & Stamp</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invoice Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={statusVariant[invoice.status] || "secondary"}>{invoice.status}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Project</span>
                <span className="font-medium text-right max-w-[180px]">{invoice.project?.name || "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Created</span>
                <span>{new Date(invoice.createdAt).toLocaleDateString("en-IN")}</span>
              </div>
              {invoice.dueDate && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Due Date</span>
                  <span>{new Date(invoice.dueDate).toLocaleDateString("en-IN")}</span>
                </div>
              )}
              {invoice.paidDate && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Paid Date</span>
                  <span>{new Date(invoice.paidDate).toLocaleDateString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Items</span>
                <span className="font-medium">{invoice.items.length}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="font-semibold">Grand Total</span>
                  <span className="font-bold text-lg">{formatCurrency(invoice.grandTotal)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative space-y-4">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                {[
                  { status: "Created", date: invoice.createdAt, icon: FileText, done: true },
                  { status: "Sent to Client", date: invoice.createdAt, icon: Send, done: invoice.status !== "PENDING" || true },
                  { status: "Payment Pending", date: invoice.dueDate, icon: Clock, done: invoice.status === "PAID" },
                  { status: "Payment Received", date: invoice.paidDate, icon: CheckCircle, done: invoice.status === "PAID" },
                ].map((event, i) => {
                  const Icon = event.icon
                  const isLast = i === (invoice.status === "PAID" ? 3 : invoice.status === "OVERDUE" ? 2 : 1)
                  return (
                    <div key={i} className="relative flex items-start gap-4 pl-1">
                      <div className={cn(
                        "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background",
                        isLast ? "border-primary bg-primary/10" : "border-muted"
                      )}>
                        <Icon className={cn("h-4 w-4", isLast ? "text-primary" : "text-muted-foreground")} />
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{event.status}</span>
                          {isLast && <Badge variant="success" className="text-[10px]">Current</Badge>}
                        </div>
                        {event.date && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(event.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2">
            <Button className="w-full" variant="outline" onClick={handleDownloadPDF}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            <Button className="w-full" variant="outline">
              <Send className="mr-2 h-4 w-4" />
              Send to Client
            </Button>
            {invoice.status === "PENDING" && (
              <Button
                className="w-full"
                variant="default"
                onClick={() => handleStatusUpdate("PAID")}
                disabled={updating}
              >
                {updating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Mark as Paid
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
