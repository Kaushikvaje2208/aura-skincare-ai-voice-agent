import './globals.css';

export const metadata = {
  title: 'Aura Skincare — AI Voice Support',
  description: 'Talk to Aria, the Aura Skincare AI voice customer-support agent.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
