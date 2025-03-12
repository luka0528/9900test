export default function ServicePage() {
  return (
    <div className="flex h-full w-full xl:max-w-[96rem]">
      <div className="h-full w-48 border-r">SideBar</div>
      <div className="flex h-full grow flex-col">
        <div className="border-b p-4">
          <h1 className="text-2xl font-bold">Service Name</h1>
          <p className="mb-4">
            This is the description of the service. It provides an overview of
            what the service is about.
          </p>
          <br />
        </div>

        <div className="flex-grow p-4">
          <h2 className="mb-2 text-xl font-semibold">Subtitle 1</h2>
          <p className="mb-4">
            Content for subtitle 1 goes here. It can be a detailed explanation
            or any relevant information.
          </p>

          <h2 className="mb-2 text-xl font-semibold">Subtitle 2</h2>
          <p className="mb-4">
            Content for subtitle 2 goes here. It can be a detailed explanation
            or any relevant information.
          </p>

          <h2 className="mb-2 text-xl font-semibold">Code Table</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead>
                <tr>
                  <th className="border px-4 py-2">Column 1</th>
                  <th className="border px-4 py-2">Column 2</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 10 }).map((_, index) => (
                  <tr key={index}>
                    <td className="border px-4 py-2">Code {index + 1}</td>
                    <td className="border px-4 py-2">
                      Description {index + 1}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
