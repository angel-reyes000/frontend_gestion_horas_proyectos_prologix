import Menu from "../components/menu";

export default function Layout ({ children }) {
    return (
    <html lang="en" className={`h-full antialiased`}>
      <body className="max-h-full flex flex-row">
        <Menu />
        {children}
      </body>
    </html>
  );
}