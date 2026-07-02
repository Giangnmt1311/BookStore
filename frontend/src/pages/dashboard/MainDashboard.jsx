import React, { useMemo, useState } from 'react'
import { useFetchAllBooksQuery, useFetchBestSellersQuery } from '../../redux/features/books/booksApi'
import { useGetAllOrdersQuery } from '../../redux/features/orders/ordersApi'
import { Link } from 'react-router-dom'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, BarChart, Bar } from 'recharts'

const MainDashboard = () => {
  const { data: books = [], isLoading: booksLoading } = useFetchAllBooksQuery()
  const { data: orders = [], isLoading: ordersLoading } = useGetAllOrdersQuery()
  const { data: bestSellers = [], isLoading: bestSellersLoading } = useFetchBestSellersQuery()

  // Calculate statistics
  const totalBooks = books?.length || 0
  const totalOrders = orders?.length || 0
  const completedOrders = orders?.filter(order => order.completed)?.length || 0
  const pendingOrders = totalOrders - completedOrders
  const totalRevenue = orders?.filter(order => order.completed)?.reduce((sum, order) => sum + (order.totalPrice || 0), 0) || 0
  const featuredBooks = books?.filter(book => book.featured)?.length || 0

  const getDefaultDateRange = () => {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - 6)

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    }
  }

  const [dateRange, setDateRange] = useState(getDefaultDateRange)

  const handleDateChange = (key, value) => {
    if (!value) return
    setDateRange(prev => {
      if (key === 'start') {
        if (new Date(value) > new Date(prev.end)) {
          return { start: value, end: value }
        }
        return { ...prev, start: value }
      }
      if (new Date(value) < new Date(prev.start)) {
        return { start: value, end: value }
      }
      return { ...prev, end: value }
    })
  }

  const getDateKey = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const dailyPerformanceData = useMemo(() => {
    if (!orders?.length || !dateRange.start || !dateRange.end) return []
    const startDate = new Date(dateRange.start)
    const endDate = new Date(dateRange.end)
    startDate.setHours(0, 0, 0, 0)
    endDate.setHours(23, 59, 59, 999)

    if (startDate > endDate) return []

    const dayMap = {}

    orders
      ?.filter(order => order.completed && order.updatedAt)
      ?.forEach(order => {
        const orderDate = new Date(order.updatedAt)
        if (orderDate < startDate || orderDate > endDate) return

        const dayKey = getDateKey(orderDate)
        if (!dayMap[dayKey]) {
          dayMap[dayKey] = {
            revenue: 0,
            productsSold: 0
          }
        }

        const productsSold = order.products?.reduce((sum, product) => sum + (product.quantity || 0), 0) || 0

        dayMap[dayKey].revenue += order.totalPrice || 0
        dayMap[dayKey].productsSold += productsSold
      })

    const result = []
    const cursor = new Date(startDate)

    while (cursor <= endDate) {
      const key = getDateKey(cursor)
      const data = dayMap[key] || { revenue: 0, productsSold: 0 }
      result.push({
        dateKey: key,
        label: cursor.toLocaleDateString(undefined, { month: 'short', day: '2-digit' }),
        fullLabel: cursor.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' }),
        revenue: parseFloat(data.revenue.toFixed(2)),
        productsSold: data.productsSold
      })

      cursor.setDate(cursor.getDate() + 1)
    }

    return result
  }, [orders, dateRange])

  const performanceSummary = useMemo(() => {
    return dailyPerformanceData.reduce((acc, day) => {
      acc.revenue += day.revenue
      acc.productsSold += day.productsSold
      return acc
    }, { revenue: 0, productsSold: 0 })
  }, [dailyPerformanceData])

  const recentOrders = orders?.slice(0, 5) || []

  const top5BestSellers = useMemo(() => {
    if (!bestSellers || bestSellers.length === 0) return [];
    
    const booksWithRevenue = bestSellers.map((book) => ({
      name: book.title.length > 20 ? book.title.substring(0, 20) + '...' : book.title,
      fullName: book.title,
      quantity: book.totalQuantity || book.orderCount || 0,
      revenue: parseFloat(((book.totalQuantity || book.orderCount || 0) * (book.newPrice || 0)).toFixed(2))
    }));
    
    booksWithRevenue.sort((a, b) => b.revenue - a.revenue);
    
    return booksWithRevenue.slice(0, 5);
  }, [bestSellers])

  if (booksLoading || ordersLoading || bestSellersLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-3xl font-bold text-gray-800">Dashboard Overview</h2>
        <p className="text-gray-600 mt-2">Welcome to your admin dashboard</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Books Card */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Books</p>
              <p className="text-3xl font-bold mt-2">{totalBooks}</p>
            </div>
            <div className="bg-blue-400 bg-opacity-30 rounded-full p-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
          <Link to="/dashboard/manage-books" className="text-blue-100 text-sm mt-4 inline-block hover:text-white">
            View all books →
          </Link>
        </div>

        {/* Total Orders Card */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Total Orders</p>
              <p className="text-3xl font-bold mt-2">{totalOrders}</p>
            </div>
            <div className="bg-purple-400 bg-opacity-30 rounded-full p-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
          <Link to="/dashboard/manage-orders" className="text-purple-100 text-sm mt-4 inline-block hover:text-white">
            View all orders →
          </Link>
        </div>

        {/* Pending Orders Card */}
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">Pending Orders</p>
              <p className="text-3xl font-bold mt-2">{pendingOrders}</p>
            </div>
            <div className="bg-yellow-400 bg-opacity-30 rounded-full p-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <Link to="/dashboard/manage-orders" className="text-yellow-100 text-sm mt-4 inline-block hover:text-white">
            Manage orders →
          </Link>
        </div>

        {/* Total Revenue Card */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Revenue</p>
              <p className="text-3xl font-bold mt-2">${totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-green-400 bg-opacity-30 rounded-full p-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-green-100 text-sm mt-4">{completedOrders} completed orders</p>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Featured Books Card */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">Featured Books</h3>
            <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-semibold">
              {featuredBooks}
            </span>
          </div>
          <p className="text-gray-600 mb-4">Books currently featured on the homepage</p>
          <Link 
            to="/dashboard/manage-books" 
            className="text-indigo-600 hover:text-indigo-800 font-medium text-sm inline-flex items-center"
          >
            Manage featured books →
          </Link>
        </div>

        {/* Completion Rate Card */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">Order Completion Rate</h3>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
              {totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : 0}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div 
              className="bg-green-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0}%` }}
            ></div>
          </div>
          <p className="text-gray-600 text-sm">
            {completedOrders} of {totalOrders} orders completed
          </p>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-800">Recent Orders</h3>
            <Link 
              to="/dashboard/manage-orders" 
              className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
            >
              View all →
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          {recentOrders.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.name}</div>
                      <div className="text-sm text-gray-500">{order.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      ${order.totalPrice}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        order.completed 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.completed ? 'Completed' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-gray-500">
              No orders yet. Orders will appear here once customers start placing orders.
            </div>
          )}
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-gray-800">Revenue Chart</h3>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  From
                </label>
                <input
                  type="date"
                  value={dateRange.start}
                  max={dateRange.end}
                  onChange={(e) => handleDateChange('start', e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  To
                </label>
                <input
                  type="date"
                  value={dateRange.end}
                  min={dateRange.start}
                  onChange={(e) => handleDateChange('end', e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="button"
                onClick={() => setDateRange(getDefaultDateRange())}
                className="mt-6 md:mt-0 inline-flex items-center justify-center rounded-lg bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-100 transition"
              >
                Last 7 days
              </button>
            </div>
          </div>
        </div>
        <div className="p-6">
          {dailyPerformanceData.length > 0 ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <p className="text-sm text-green-700 font-medium">Revenue in range</p>
                  <p className="text-3xl font-bold text-green-700 mt-1">
                    ${performanceSummary.revenue.toFixed(2)}
                  </p>
                </div>
                <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                  <p className="text-sm text-indigo-700 font-medium">Products sold</p>
                  <p className="text-3xl font-bold text-indigo-700 mt-1">
                    {performanceSummary.productsSold}
                  </p>
                </div>
              </div>
              <div>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={dailyPerformanceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="label" 
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      yAxisId="left"
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                      tickFormatter={(value) => `${value} pcs`}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value, name) => {
                        if (name === 'Revenue') return [`$${value.toFixed(2)}`, name]
                        if (name === 'Products Sold') return [value, name]
                        return [value, name]
                      }}
                      labelFormatter={(label) => {
                        const data = dailyPerformanceData.find(d => d.label === label)
                        return data ? data.fullLabel : label
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      name="Revenue"
                      stroke="#10b981" 
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      yAxisId="left"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="productsSold" 
                      name="Products Sold"
                      stroke="#6366f1"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      yAxisId="right"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Daily Summary Table */}
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-gray-700 mb-4">Daily breakdown</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Month
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Revenue
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Products sold
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {dailyPerformanceData.map((day) => (
                        <tr key={day.dateKey} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">{day.fullLabel}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-bold text-green-600">
                              ${day.revenue.toFixed(2)}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                              {day.productsSold}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500 space-y-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a5 5 0 00-10 0v2M5 9h14l1 11H4L5 9z" />
              </svg>
              <div>
                <p className="font-semibold text-gray-600">No completed orders in this date range.</p>
                <p className="text-sm text-gray-400 mt-1">Select a broader range or wait for new orders to populate the chart.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top 5 Best Sellers */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-800">Top 5 Best Sellers</h3>
        </div>
        <div className="p-6">
          {top5BestSellers.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={top5BestSellers} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value) => [`$${value.toFixed(2)}`, 'Revenue']}
                  labelFormatter={(label) => {
                    const data = top5BestSellers.find(d => d.name === label)
                    return data ? data.fullName : label
                  }}
                />
                <Bar 
                  dataKey="revenue" 
                  fill="#6366f1" 
                  radius={[8, 8, 0, 0]}
                  name="Revenue"
                  maxBarSize={80}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="p-12 text-center text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p className="mt-4">No best sellers data available yet.</p>
              <p className="text-sm text-gray-400 mt-1">Best sellers will appear here once books are sold.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MainDashboard

