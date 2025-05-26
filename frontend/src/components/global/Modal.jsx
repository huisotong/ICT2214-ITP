import styles from "../../styles/global.module.css";

export default function Modal({ modal }) {
  return (
    <div className={styles.modalcontainer}>
      <section
        className={`${styles.modalbox} ${
          modal.type === "fail" ? styles.modalfail : styles.modalsuccess
        }`}
      >
        {modal.message}
      </section>
    </div>
  );
}
