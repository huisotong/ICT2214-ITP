import React, { useState } from 'react';
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa6";
import styles from '../../styles/global.module.css';

const Input = ({ value, onChange, placeholder, label, type }) => {
  const [showPassword, setShowPassword] = useState(false);

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={styles.inputContainer}>
      {label && <label className={styles.inputLabel}>{label}</label>}

      <div className={styles.inputBox}>
        <input
          type={type === 'password' ? (showPassword ? 'text' : 'password') : type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={styles.inputField}
        />

        {type === 'password' && (
          showPassword ? (
            <FaRegEye className={styles.inputIcon} onClick={toggleShowPassword} />
          ) : (
            <FaRegEyeSlash className={styles.inputIcon} onClick={toggleShowPassword} />
          )
        )}
      </div>
    </div>
  );
};

export default Input;
