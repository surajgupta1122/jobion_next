export default function Forgot() {
  return (
    <div className="min-h-[80vh] grid place-items-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white border border-gray-200 shadow-lg">
        <div className="px-6 pt-6 border-b border-gray-200 pb-4">
          <h2 className="text-2xl font-semibold">Reset your password</h2>
          <p className="text-sm text-slate-600">We'll email you a reset link.</p>
        </div>
        <div className="px-6 pb-6 space-y-3 pt-6">
          <input placeholder="Email" className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" />
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors">Send reset link</button>
        </div>
      </div>
    </div>
  );
}

