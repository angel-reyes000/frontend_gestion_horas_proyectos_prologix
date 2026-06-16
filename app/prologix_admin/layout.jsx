import Menu from "../components/menu";

export default function Layout ({ children }) {
    return (
    <html lang="en" className={`h-full antialiased`}>
      <body className="max-h-full" style={{display: 'flex', flexDirection: 'row'}}>
        <Menu />
        {children}
      </body>
    </html>
  );
}