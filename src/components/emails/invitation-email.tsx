import * as React from 'react';

interface InvitationEmailProps {
    workspaceName: string;
    inviterName: string;
    loginUrl: string;
}

export const InvitationEmail: React.FC<Readonly<InvitationEmailProps>> = ({
    workspaceName,
    inviterName,
    loginUrl,
}) => (
    <div style={{
        fontFamily: 'sans-serif',
        padding: '20px',
        backgroundColor: '#f9f9f9',
        borderRadius: '10px',
        border: '1px solid #ddd',
        maxWidth: '600px',
        margin: '0 auto'
    }}>
        <h1 style={{ color: '#333', fontSize: '24px' }}>Undangan Join Workspace! 🚀</h1>
        <p style={{ color: '#555', fontSize: '16px', lineHeight: '1.5' }}>
            Halo! <strong>{inviterName}</strong> mengundang kamu untuk bergabung ke workspace <strong>"{workspaceName}"</strong> di Nexto.
        </p>
        <div style={{ textAlign: 'center', margin: '30px 0' }}>
            <a href={loginUrl} style={{
                backgroundColor: '#4F46E5',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '5px',
                textDecoration: 'none',
                fontWeight: 'bold',
                display: 'inline-block'
            }}>
                Buka Nexto Sekarang
            </a>
        </div>
        <p style={{ color: '#888', fontSize: '12px' }}>
            Jika tombol di atas tidak berfungsi, salin URL ini ke browser kamu:<br />
            <a href={loginUrl} style={{ color: '#4F46E5' }}>{loginUrl}</a>
        </p>
        <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '20px 0' }} />
        <p style={{ color: '#aaa', fontSize: '11px', textAlign: 'center' }}>
            Pesan ini dikirim otomatis oleh sistem Nexto.
        </p>
    </div>
);
