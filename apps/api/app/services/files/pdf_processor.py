import io
from pypdf import PdfReader
from sqlalchemy.orm import Session
from loguru import logger
from app.models.schema import FileRecord, FileChunk
from app.services.files.storage import storage_service

def process_pdf_document(file_id: str, db: Session) -> int:
    """
    Extracts text page-by-page from PDF, creating FileChunk records in PostgreSQL
    linked with exact page numbers. Returns total extracted page count.
    """
    file_record = db.query(FileRecord).filter(FileRecord.id == file_id).first()
    if not file_record:
        logger.error(f"File record {file_id} not found")
        return 0

    pdf_bytes = storage_service.get_file(file_record.storage_key)
    if not pdf_bytes:
        logger.error(f"Could not read PDF bytes for storage key: {file_record.storage_key}")
        return 0

    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        total_pages = len(reader.pages)
        file_record.page_count = total_pages

        for page_idx, page in enumerate(reader.pages):
            page_number = page_idx + 1
            extracted_text = page.extract_text() or ""
            
            chunk = FileChunk(
                file_id=file_id,
                page_number=page_number,
                section_title=f"Page {page_number}",
                content=extracted_text.strip()
            )
            db.add(chunk)

        file_record.processing_status = "COMPLETED"
        db.commit()
        logger.info(f"Processed PDF {file_id} with {total_pages} pages.")
        return total_pages
    except Exception as e:
        logger.error(f"Error processing PDF {file_id}: {e}")
        file_record.processing_status = "FAILED"
        db.commit()
        return 0
