import { PuffLoader } from 'react-spinners';
import { CSSProperties } from 'react';

const override: CSSProperties = {
  display: 'block',
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  zIndex: '9999',
};

export const Loading = ({ loading }: { loading: boolean }) => {
  return (
    <div className="h-screen w-screen flex justify-center items-center">
      <PuffLoader
        color={'#000000'}
        // cssOverride={override}
        loading={loading}
        size={150}
        aria-label="Loading Spinner"
      />
    </div>
  );
};
